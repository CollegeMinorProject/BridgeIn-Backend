import { Types } from "mongoose";
import { JobApplication } from "../../models/jobApplication.model";
import { JobPost } from "../../models/jobPost.model";
import { Resume } from "../../models/resume.model";
import { User, type UserRole } from "../../models/user.model";
import { notificationEnque, emailEnqueue } from "../../queues/producer/producer";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { resumeDownloadUrl } from "../../utils/cloudinary";

const sevenDays = 7 * 24 * 60 * 60 * 1000;
const hiringRoles: UserRole[] = ["recruiter", "employer"];

function validId(id: unknown) {
  if (typeof id !== "string" || !Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid ID");
  return id;
}

async function verifyRole(id: string | undefined, roles: UserRole[]) {
  if (!id) throw new ApiError(401, "Unauthorized");
  const user = await User.findById(id).select("role").lean();
  if (!user || !roles.includes(user.role)) throw new ApiError(403, "This action is unavailable for your role");
  return user._id;
}

async function recruiterApplication(userId: string | undefined, applicationId: unknown) {
  const recruiter = await verifyRole(userId, hiringRoles);
  const application = await JobApplication.findById(validId(applicationId)).lean();
  if (!application || !await JobPost.exists({ _id: application.job_post_id, posted_by: recruiter })) {
    throw new ApiError(404, "Application not found");
  }
  return application;
}

const populated = [
  { path: "job_post_id", select: "title company_name" },
  { path: "candidate_id", select: "name avatar" },
  { path: "resume_id", select: "name" },
];

export const listMyApplications = asyncHandler(async (req, res) => {
  const candidate = await verifyRole(req.user, ["candidate"]);
  const applications = await JobApplication.find({ candidate_id: candidate })
    .populate(populated).sort({ appliedAt: -1, _id: -1 }).lean();
  res.json(new ApiResponse(200, applications));
});

export const listRecruiterApplications = asyncHandler(async (req, res) => {
  const recruiter = await verifyRole(req.user, hiringRoles);
  const jobs = await JobPost.find({ posted_by: recruiter }).distinct("_id");
  const applications = await JobApplication.find({ job_post_id: { $in: jobs } })
    .populate(populated).sort({ appliedAt: -1, _id: -1 }).lean();
  res.json(new ApiResponse(200, applications));
});

export const submitApplication = asyncHandler(async (req, res) => {
  const candidate = await verifyRole(req.user, ["candidate"]);
  const jobId = validId(req.body?.jobId);
  const resumeId = validId(req.body?.resumeId);
  const [job, resume] = await Promise.all([
    JobPost.exists({ _id: jobId, isOpen: true }),
    Resume.exists({ _id: resumeId, belong_to: candidate }),
  ]);
  if (!job) throw new ApiError(404, "This job is no longer open");
  if (!resume) throw new ApiError(404, "Resume not found");
  await JobApplication.init();
  try {
    const application = await JobApplication.create({
      job_post_id: jobId, candidate_id: candidate, resume_id: resumeId,
    });
    res.status(201).json(new ApiResponse(201, { _id: application.id }, "Application submitted"));
  } catch (failure) {
    if (failure instanceof Error && "code" in failure && failure.code === 11000) {
      throw new ApiError(409, "You already applied for this job");
    }
    throw failure;
  }
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await recruiterApplication(req.user, req.params.applicationId);
  const status = req.body?.status;
  if (status !== "accepted" && status !== "rejected") {
    throw new ApiError(400, "Choose Accepted or Rejected");
  }
  const updated = await JobApplication.findOneAndUpdate(
    { _id: application._id, status: { $in: ["applied", "interviewing"] } },
    { $set: { status, ...(status === "accepted" && { acceptedAt: new Date() }) } },
    { new: true, runValidators: true },
  ).select("status acceptedAt");
  if (!updated) throw new ApiError(409, "This application is no longer under review");

  const notification = notificationEnque({
    recipient_id: String(application.candidate_id),
    sender_id: String(req.user),
    type: "job_status",
    reference_type: "JobApplication",
    reference_id: String(application._id),
  });
  if (status === "rejected") {
    await Promise.allSettled([notification, (async () => {
      const applicant = await User.findById(application.candidate_id).select("email");
      if (applicant) await emailEnqueue(
        applicant.email,
        "Update on your job application",
        "<p>Thank you for applying. Your application was not shortlisted this time.</p>",
      );
    })()]);
  } else {
    await Promise.allSettled([notification]);
  }

  res.json(new ApiResponse(200, updated));
});

export const scheduleInterview = asyncHandler(async (req, res) => {
  const application = await recruiterApplication(req.user, req.params.applicationId);
  const input = req.body?.scheduledAt;
  const date = typeof input === "string" ? new Date(input) : new Date(NaN);
  if (application.status !== "accepted" || !application.acceptedAt) {
    throw new ApiError(409, "Accept the application before scheduling an interview");
  }
  const earliest = Math.max(Date.now(), application.acceptedAt.getTime());
  const latest = application.acceptedAt.getTime() + sevenDays;
  if (!Number.isFinite(date.getTime()) || date.getTime() < earliest || date.getTime() > latest) {
    throw new ApiError(400, "Choose a future interview time within seven days of acceptance");
  }
  const updated = await JobApplication.findOneAndUpdate(
    { _id: application._id, status: "accepted" },
    { $set: { status: "interview_scheduled", interviewAt: date } },
    { new: true, runValidators: true },
  ).select("status interviewAt");
  if (!updated) throw new ApiError(409, "The application changed. Refresh and try again.");

  res.json(new ApiResponse(200, updated, "Interview scheduled"));
});

export const cancelApplication = asyncHandler(async (req, res) => {
  const candidate = await verifyRole(req.user, ["candidate"]);
  const id = validId(req.params.applicationId);
  const current = await JobApplication.findOne({ _id: id, candidate_id: candidate }).select("status");
  if (!current) throw new ApiError(404, "Application not found");
  if (current.status === "cancelled") {
    res.json(new ApiResponse(200, current));
    return;
  }
  const cancelled = await JobApplication.findOneAndUpdate(
    { _id: id, candidate_id: candidate, status: { $in: ["applied", "accepted", "interview_scheduled", "interviewing"] } },
    { $set: { status: "cancelled" } },
    { new: true, runValidators: true },
  ).select("status");
  if (!cancelled) throw new ApiError(409, "This application can no longer be cancelled");
  res.json(new ApiResponse(200, cancelled, "Application cancelled"));
});

export const submittedResume = asyncHandler(async (req, res) => {
  const application = await recruiterApplication(req.user, req.params.applicationId);
  const resume = await Resume.findOne({ _id: application.resume_id, belong_to: application.candidate_id })
    .select("resume_link resume_public_id").lean();
  if (!resume) throw new ApiError(404, "Submitted resume not found");
  const url = new URL(resumeDownloadUrl(resume.resume_link, resume.resume_public_id));
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    throw new ApiError(404, "Submitted resume not found");
  }
  const file = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!file?.ok) throw new ApiError(502, "Could not open the submitted resume");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 1024 * 1024 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new ApiError(502, "Invalid submitted PDF");
  }
  res.set({ "Cache-Control": "no-store", "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff" });
  res.type("application/pdf").send(bytes);
});
