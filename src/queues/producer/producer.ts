import { Queue } from "bullmq";
import redisConfig from "../../config/redis.config";
const notificationQueue = new Queue("email-queue", {
  connection: redisConfig,
});
export async function emailEnqueue(to: string, sub: string, html: string) {
  const res = await notificationQueue.add("email", { to, sub, html });
  console.log("Job added to Queue", res.id);
}
