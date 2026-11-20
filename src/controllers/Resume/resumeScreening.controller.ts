import { Request, Response } from "express";
import mongoose from "mongoose";
import { JobPost } from "../../models/jobPost.model";
import { Resume } from "../../models/resume.model";
import { screenResumeAgainstJob } from "../../services/resumeScreening.service";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";

export const screenResumeController = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId, resumeId } = req.body;

    if (!jobId || !resumeId) {
      throw new ApiError(400, "Both jobId and resumeId are required.");
    }

    if (
      !mongoose.Types.ObjectId.isValid(jobId) ||
      !mongoose.Types.ObjectId.isValid(resumeId)
    ) {
      throw new ApiError(400, "Invalid jobId or resumeId format.");
    }

    // Fetch Job and Resume in parallel
    const [job, resume] = await Promise.all([
      JobPost.findById(jobId),
      Resume.findById(resumeId),
    ]);

    if (!job) {
      throw new ApiError(404, "Job post not found.");
    }

    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }

    const result = await screenResumeAgainstJob(resume.resumeLink, job);

    return res
      .status(200)
      .json(
        new ApiResponse(200, result, "Resume screened successfully.")
      );
  }
);