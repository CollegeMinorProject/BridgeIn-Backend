import { Worker } from "bullmq";
import { sendEmail } from "../../utils/Mail.util";
import redisConfig from "../../config/redis.config";
const worker = new Worker(
  "email-queue",
  async (job) => {
    console.log("I got a message");
    console.log(job);
    await sendEmail(job.data.to, job.data.sub, job.data.html);
  },
  { connection: redisConfig },
);
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err.message);
});

export default worker;
