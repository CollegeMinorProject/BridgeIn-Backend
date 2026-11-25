import { Types } from "mongoose";
import { z } from "zod";
import { JOB_TYPES, JobPost } from "../../models/jobPost.model";
import { User } from "../../models/user.model";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";

const jobInput = z.object({
  title: z.string().trim().min(1).max(150),
  company_name: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(100),
  job_type: z.enum(JOB_TYPES),
  description: z.string().trim().min(1),
  requirements: z.string().trim().min(1),
  skills_required: z.array(z.string().trim().min(1)).default([]),
});

export const createJob = asyncHandler(async (req, res) => {
  const user = req.user && await User.findById(req.user).select("role");
  if (!user || (user.role !== "recruiter" && user.role !== "employer")) {
    throw new ApiError(403, "Only recruiters and employers can post jobs");
  }
  const result = jobInput.safeParse(req.body);
  if (!result.success) throw new ApiError(400, "Invalid job fields");
  const job = await JobPost.create({ ...result.data, posted_by: user._id });
  res.status(201).json(new ApiResponse(201, job, "Job posted successfully"));
});

export const getJobs = asyncHandler(async (_req, res) => {
  const jobs = await JobPost.find({ isOpen: true })
    .sort({ createdAt: -1 })
    .populate("posted_by", "name email");
  res.status(200).json(new ApiResponse(200, jobs, "Jobs retrieved"));
});

function ownedJob(jobId: unknown, userId?: string) {
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (typeof jobId !== "string" || !Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }
  return { _id: jobId, posted_by: userId };
}

export const updateJobStatus = asyncHandler(async (req, res) => {
  const filter = ownedJob(req.params.jobId, req.user);
  const { isOpen } = req.body;
  if (typeof isOpen !== "boolean") throw new ApiError(400, "isOpen must be a boolean");
  const job = await JobPost.findOneAndUpdate(filter, { isOpen }, { new: true });
  if (!job) throw new ApiError(404, "Job not found");
  res.status(200).json(new ApiResponse(200, job, "Job updated"));
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await JobPost.findOneAndDelete(ownedJob(req.params.jobId, req.user));
  if (!job) throw new ApiError(404, "Job not found");
  res.status(200).json(new ApiResponse(200, null, "Job deleted"));
});


export const getJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (typeof jobId !== "string" || !Types.ObjectId.isValid(jobId)) throw new ApiError(400, "Invalid job ID");
  const job = await JobPost.findById(jobId).populate("posted_by", "name").lean();
  if (!job) throw new ApiError(404, "Job not found");
  res.json(new ApiResponse(200, job));
});
