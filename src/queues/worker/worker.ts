import { Worker } from "bullmq";
import { sendEmail } from "../../utils/Mail.util";
import redisConfig from "../../config/redis.config";
import { createNotification } from "../functions/queueFunctions";
export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log("I got a email");
    console.log(job);
    await sendEmail(job.data.to, job.data.sub, job.data.html);
  },
  { connection: redisConfig },
);
emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err.message);
});
export const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    console.log("I got a Notification");
    console.log(job);
    await createNotification({ ...job.data });
  },
);
