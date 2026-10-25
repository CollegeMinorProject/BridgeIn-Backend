import { NextFunction, Response, Request } from "express";
const RATE_LIMIT_TIME = 60;
const RATE_LIMIT_MAX_REQUEST = 5;
import { redisConfig } from "../index";
import { RATE_LIMIT_KEY } from "../utils/RedisKeyFunctions";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
export async function productRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next();
  return;
  try {
    const ip = req.ip || "unknown";
    const ratekey = RATE_LIMIT_KEY(ip);
    const requestCount = await redisConfig.incr(ratekey);
    res.set({
      "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUEST,
      "X-RateLimit-Remaining": Math.max(
        0,
        RATE_LIMIT_MAX_REQUEST - requestCount,
      ),
    });
    if (requestCount === 1) {
      await redisConfig.expire(ratekey, RATE_LIMIT_TIME);
    } else if (requestCount > RATE_LIMIT_MAX_REQUEST) {
      res.status(429).json(new ApiResponse(429, "Too many Request"));
      return;
    }

    next();
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
    next();
  }
}
