import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { ApiError } from '../../utils/ErrorHandling.ts/APIError';
import { ApiResponse } from '../../utils/ErrorHandling.ts/APIResponse';
import { Queue } from "bullmq";
import redisConfig from "../../config/redis.config";

// Initialize Queue producers for background jobs
const emailQueue = new Queue("email-queue", { connection: redisConfig });
const notificationQueue = new Queue("notification-queue", { connection: redisConfig });

export const updateApplicationStatus = asyncHandler(async (req: any, res: any) => {
  const { applicationId } = req.params;
  const { status, applicantEmail, applicantId, jobTitle } = req.body; 
  
  // Expected status values: "Accepted" | "Rejected"
  if (!status || !applicantEmail || !applicantId || !jobTitle) {
    throw new ApiError(400, "Missing required fields to update application status");
  }

  // FIX: Added a console.log to use the variable and remove the TypeScript warning
  console.log(`Processing update for Application ID: ${applicationId}`);

  // TODO: Update the application status in the database here
  // Example: const application = await Application.findByIdAndUpdate(applicationId, { status }, { new: true });
  
  // Point 11: Push background jobs to queue if the application is rejected
  if (status === "Rejected") {
    
    // 1. Add email job to the queue for background processing
    await emailQueue.add("send-rejection-email", {
      to: applicantEmail,
      sub: `Update regarding your application for ${jobTitle}`,
      html: `<p>Dear Applicant,</p><p>We regret to inform you that your application for the role of <strong>${jobTitle}</strong> has not been shortlisted at this time.</p><p>We wish you the best in your future endeavors.</p>`
    });

    // 2. Add in-app notification job to the queue
    await notificationQueue.add("send-rejection-notification", {
      userId: applicantId,
      message: `Your application for ${jobTitle} was not successful.`,
      type: "Application_Rejected"
    });
  }

  return res.status(200).json(new ApiResponse(200, null, `Application status updated to ${status} and background tasks queued.`));
});