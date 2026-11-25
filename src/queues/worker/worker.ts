import { UnrecoverableError, Worker } from "bullmq";
import { sendEmail } from "../../utils/Mail.util";
import redisConfig from "../../config/redis.config";
import { createNotification, type ForCreateNotification } from "../functions/queueFunctions";
import {
  completedJobRetention,
  failedJobRetention,
  OTP_LIFETIME_MS,
  type EmailJobData,
} from "../queuePolicy";

const expiredOtp = "OTP_EXPIRED";

export const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job) => {
    const { to, sub, html, expiresAt } = job.data;
    const isOtp = job.name === "otp-email" || sub === "Email Verification OTP" || sub === "Verify your email";
    if (isOtp) {
      job.opts.removeOnComplete = true;
      job.opts.removeOnFail = true;
      // Pre-upgrade OTP jobs lack an explicit expiry. Use their enqueue time.
      const deadline = expiresAt ?? (job.name === "otp-email" ? NaN : job.timestamp + OTP_LIFETIME_MS);
      if (!Number.isFinite(deadline) || Date.now() >= deadline) {
        throw new UnrecoverableError(expiredOtp);
      }
    }
    try {
      await sendEmail(to, sub, html);
    } catch {
      throw new Error("EMAIL_DELIVERY_FAILED");
    }
  },
  {
    connection: redisConfig,
    removeOnComplete: completedJobRetention,
    removeOnFail: failedJobRetention,
  },
);

export const notificationWorker = new Worker<ForCreateNotification>(
  "notification-queue",
  async (job) => {
    try {
      await createNotification(job.data);
    } catch {
      throw new Error("NOTIFICATION_WRITE_FAILED");
    }
  },
  {
    connection: redisConfig,
    removeOnComplete: completedJobRetention,
    removeOnFail: failedJobRetention,
  },
);

emailWorker.on("failed", (job, error) => {
  if (job && job.finishedOn === undefined) return;
  const reason = error instanceof UnrecoverableError && error.message === expiredOtp
    ? expiredOtp
    : "EMAIL_DELIVERY_FAILED";
  console.error("Queue job failed", { queue: emailWorker.name, jobId: job?.id, reason });
});

notificationWorker.on("failed", (job) => {
  if (job && job.finishedOn === undefined) return;
  console.error("Queue job failed", {
    queue: notificationWorker.name,
    jobId: job?.id,
    reason: "NOTIFICATION_WRITE_FAILED",
  });
});

for (const worker of [emailWorker, notificationWorker]) {
  worker.on("error", () => {
    console.error("Queue worker error", { queue: worker.name, reason: "WORKER_ERROR" });
  });
}
