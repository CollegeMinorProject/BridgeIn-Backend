import app from "./server";
import { connectToDB } from "./config/db.confit";
import getEnv from "./getEnv";
import connectRedis from "./config/redis.config";
export let redisConfig;

async function startServer() {
  redisConfig = connectRedis();
  await connectToDB();
  app.listen(getEnv.Port, () => {
    console.log(`Server is now listening to port ${getEnv.Port}`);
  });
}
startServer().catch((err) => {
  console.log("Error while starting the server", err);
  process.exit(1);
});
