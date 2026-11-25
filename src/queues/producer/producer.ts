import { Queue } from "bullmq";
import redisConfig from "../../config/redis.config";
import type { ForCreateNotification } from "../functions/queueFunctions";
import { completedJobRetention, failedJobRetention, type EmailJobData } from "../queuePolicy";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 500 },
  removeOnComplete: completedJobRetention,
  removeOnFail: failedJobRetention,
};
// HTTP handlers enqueue jobs. Bound Redis waits here while workers continue
// using the shared connection configured for unlimited retries.
const producerRedis = redisConfig.duplicate({
  maxRetriesPerRequest: 0,
  enableOfflineQueue: false,
  commandTimeout: 2_000,
});
producerRedis.on("error", () => console.error("Queue producer Redis error"));

const emailQueue = new Queue<EmailJobData>("email-queue", {
  connection: producerRedis,
  defaultJobOptions,
});
const notificationQueue = new Queue<ForCreateNotification>("notification-queue", {
  connection: producerRedis,
  defaultJobOptions,
});
function ensureProducerReady() {
  if (producerRedis.status !== "ready") throw new Error("Queue is temporarily unavailable");
}

export async function emailEnqueue(to: string, sub: string, html: string) {
  ensureProducerReady();
  await emailQueue.add("email", { to, sub, html });
}

export async function otpEmailEnqueue(to: string, sub: string, html: string, expiresAt: number) {
  ensureProducerReady();
  await emailQueue.add("otp-email", { to, sub, html, expiresAt }, {
    removeOnComplete: true,
    removeOnFail: true,
  });
}

export async function notificationEnque(params: ForCreateNotification) {
  ensureProducerReady();
  await notificationQueue.add("notification", params);
}
