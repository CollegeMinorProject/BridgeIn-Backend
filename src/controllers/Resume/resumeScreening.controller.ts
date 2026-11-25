import { Request, Response } from "express";
import mongoose from "mongoose";
import { JobPost } from "../../models/jobPost.model";
import { Resume } from "../../models/resume.model";
import { ResumeScreening } from "../../models/resumeScreening.model";
import { extractResumeText, screenResumeAgainstJob } from "../../services/resumeScreening.service";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { resumeDownloadUrl } from "../../utils/cloudinary";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";

export const screenResumeController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
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
      Resume.findOne({ _id: resumeId, belong_to: req.user }),
    ]);

    if (!job) {
      throw new ApiError(404, "Job post not found.");
    }

    if (!resume) {
      throw new ApiError(404, "Resume not found.");
    }

    const resumeText = resume.extracted_text || await extractResumeText(resumeDownloadUrl(resume.resume_link, resume.resume_public_id));
    if (!resume.extracted_text) {
      await Resume.updateOne({ _id: resume._id }, { $set: { extracted_text: resumeText } });
    }
    const result = await screenResumeAgainstJob(resumeText, job);
    const screening = await ResumeScreening.create({
      candidate_id: req.user,
      resume_id: resume._id,
      job_post_id: job._id,
      score: result.score,
      feedback: result.feedback.join("\n"),
      missing_skills: result.missingSkills,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { ...result, screening_id: screening.id }, "Resume screened successfully.")
      );
  }
);