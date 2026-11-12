import { Queue } from "bullmq";
import redisConfig from "../../config/redis.config";
import type { ForCreateNotification } from "../functions/queueFunctions";
const emailQueue = new Queue("email-queue", {
  connection: redisConfig,
});
const notificationQueue = new Queue("notification-queue", {
  connection: redisConfig,
});
export async function emailEnqueue(to: string, sub: string, html: string) {
  const res = await emailQueue.add(
    "email",
    { to, sub, html },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 500,
      },
    },
  );
  console.log("Job added to Queue", res.id);
}
export async function notificationEnque(params: ForCreateNotification) {
  const res = await notificationQueue.add(
    "notification",
    {
      ...params,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 500,
      },
    },
  );
  console.log("Job added to Queue", res.id);
}
