import { Worker } from "bullmq";
import { sendEmail } from "../../utils/Mail.util";
import redisConfig from "../../config/redis.config";
import { 
  createNotification, 
  processPostDeletionCleanup, 
  processPostUpdateCleanup 
} from "../functions/queueFunctions";

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
  { connection: redisConfig },
);

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification Job ${job?.id} failed with error:`, err.message);
});

// New worker to handle background cleanup for posts
export const postWorker = new Worker(
  "post-queue",
  async (job) => {
    console.log(`Processing post background task: ${job.name}`);
    
    switch (job.name) {
      case "delete-post-cleanup":
        await processPostDeletionCleanup(job.data);
        break;
      case "update-post-cleanup":
        await processPostUpdateCleanup(job.data);
        break;
      default:
        console.warn(`No handler found for job: ${job.name}`);
    }
  },
  { connection: redisConfig },
);

postWorker.on("completed", (job) => {
  console.log(`Post Job ${job.id} (${job.name}) completed!`);
});

postWorker.on("failed", (job, err) => {
  console.error(`Post Job ${job?.id} (${job?.name}) failed with error:`, err.message);
});