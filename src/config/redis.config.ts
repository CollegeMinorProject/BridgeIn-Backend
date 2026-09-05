import getEnv from "../getEnv";
import Redis, { RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};

const connectRedis = (): Redis => {
  const redisConfig: Redis = new Redis(getEnv.REDIS_URL, redisOptions);

  redisConfig.on("connect", (): void => console.log("Redis connected"));
  redisConfig.on("error", (err: Error): void =>
    console.error("Redis error:", err),
  );

  return redisConfig;
};

export default connectRedis;
