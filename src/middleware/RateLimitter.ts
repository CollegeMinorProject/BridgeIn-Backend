import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import redisConfig from "../config/redis.config";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
import { RATE_LIMIT_KEY } from "../utils/RedisKeyFunctions";

type Budget = { capacity: number; refillMs: number };
type Policy = {
  scope: string;
  ip: Budget;
  account?: Budget;
  failClosed?: boolean;
};

// Each millisecond earns one unit. Spending a token costs refillMs units.
// Redis supplies the clock and checks and debits all applicable buckets atomically.
const consumeTokens = `
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local balances = {}
local times = {}
local retryMs = 0
local selectedLimit = 0
local selectedRemaining = math.huge

for i, key in ipairs(KEYS) do
  local capacity = tonumber(ARGV[2 * i - 1])
  local cost = tonumber(ARGV[2 * i])
  local maximum = capacity * cost
  local stored = redis.call("HMGET", key, "balance", "time")
  local last = tonumber(stored[2]) or now
  local timestamp = math.max(now, last)
  local balance = math.min(maximum, (tonumber(stored[1]) or maximum) + timestamp - last)
  balances[i] = balance
  times[i] = timestamp
  local remaining = math.max(0, math.floor(balance / cost) - 1)
  if remaining < selectedRemaining then
    selectedLimit = capacity
    selectedRemaining = remaining
  end
  if balance < cost then
    local wait = cost - balance + timestamp - now
    if wait > retryMs then
      selectedLimit = capacity
      retryMs = wait
    end
  end
end

if retryMs > 0 then
  return {0, selectedLimit, 0, retryMs}
end

for i, key in ipairs(KEYS) do
  local capacity = tonumber(ARGV[2 * i - 1])
  local cost = tonumber(ARGV[2 * i])
  local balance = balances[i] - cost
  redis.call("HSET", key, "balance", balance, "time", times[i])
  redis.call("PEXPIRE", key, capacity * cost - balance + times[i] - now)
end

return {1, selectedLimit, selectedRemaining, 0}
`;

// BullMQ needs unlimited retries on its worker connection. HTTP requests need
// a bounded wait and must never queue a debit after returning a response.
const limiterRedis = redisConfig.duplicate({
  commandTimeout: 750,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
});
limiterRedis.on("error", (error: Error) => console.error("Rate limiter Redis error:", error.message));

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function tokenBucket(policy: Policy): RequestHandler {
  return async (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const keys = [RATE_LIMIT_KEY(policy.scope, "ip", hash(ip))];
    const args = [policy.ip.capacity, policy.ip.refillMs];
    if (policy.account && typeof req.body?.email === "string") {
      const email = req.body.email.trim().toLowerCase();
      if (email.length > 0 && email.length <= 254) {
        keys.push(RATE_LIMIT_KEY(policy.scope, "account", hash(email)));
        args.push(policy.account.capacity, policy.account.refillMs);
      }
    }

    let result: [number, number, number, number];
    try {
      result = await limiterRedis.eval(consumeTokens, keys.length, ...keys, ...args) as typeof result;
    } catch {
      if (!policy.failClosed) return next();
      res.set("Retry-After", "1");
      res.status(503).json(new ApiResponse(503, null, "Authentication is temporarily unavailable"));
      return;
    }

    const [allowed, limit, remaining, retryMs] = result;
    res.set({
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
    });
    if (allowed === 1) return next();

    res.set("Retry-After", String(Math.max(1, Math.ceil(retryMs / 1000))));
    res.status(429).json(new ApiResponse(429, null, "Too many requests. Try again later."));
  };
}

export const productRateLimiter = tokenBucket({
  scope: "api",
  ip: { capacity: 120, refillMs: 500 },
});

export const authRateLimiter = tokenBucket({
  scope: "auth",
  ip: { capacity: 30, refillMs: 10_000 },
  failClosed: true,
});

export const credentialRateLimiter = tokenBucket({
  scope: "auth-credentials",
  ip: { capacity: 10, refillMs: 30_000 },
  account: { capacity: 5, refillMs: 60_000 },
  failClosed: true,
});

export const emailCodeRateLimiter = tokenBucket({
  scope: "auth-email",
  ip: { capacity: 8, refillMs: 60_000 },
  account: { capacity: 3, refillMs: 300_000 },
  failClosed: true,
});
