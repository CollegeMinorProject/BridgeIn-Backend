import getEnv from "../getEnv";
import Redis, { RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
};
const redisConfig: Redis = new Redis(getEnv.REDIS_URL, redisOptions);
redisConfig.on("connect", (): void =>
  console.log("Redis connected successfully!"),
);
redisConfig.on("error", (err: Error): void =>
  console.error("Redis error:", err),
);
export default redisConfig;
