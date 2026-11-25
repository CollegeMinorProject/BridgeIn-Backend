import { Types } from "mongoose";
import { z } from "zod";
import { JobApplication } from "../../models/jobApplication.model";
import { Resume } from "../../models/resume.model";
import { ResumeScreening } from "../../models/resumeScreening.model";
import { User } from "../../models/user.model";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { deleteResume, uploadResume } from "../../utils/cloudinary";

export const MAX_RESUME_BYTES = 1024 * 1024;
const MAX_RESUMES = 10;
const maxLimitMessage = "Max resume limit reached.";
const resumeName = z.string().trim().min(1).max(100);
const summaryFields = "_id name uploadedAt";

function summary(resume: { _id: Types.ObjectId; name?: string | null; uploadedAt?: Date }) {
  return {
    _id: String(resume._id),
    name: resume.name || "Resume",
    uploadedAt: resume.uploadedAt,
  };
}

function ownerFilter(userId?: string, resumeId?: unknown) {
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (typeof resumeId !== "string" || !Types.ObjectId.isValid(resumeId)) {
    throw new ApiError(400, "Invalid resume ID");
  }
  return { _id: resumeId, belong_to: userId };
}

export const listResumes = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  const resumes = await Resume.find({ belong_to: req.user })
    .select(summaryFields).sort({ uploadedAt: -1, _id: -1 }).lean();
  res.json(new ApiResponse(200, { resumes: resumes.map(summary), limit: MAX_RESUMES }));
});

export const renameResume = asyncHandler(async (req, res) => {
  const filter = ownerFilter(req.user, req.params.id);
  const name = resumeName.safeParse(req.body?.name);
  if (!name.success) throw new ApiError(400, "Enter a resume name between 1 and 100 characters.");
  const updated = await Resume.findOneAndUpdate(filter, { $set: { name: name.data } }, { new: true, runValidators: true })
    .select(summaryFields).lean();
  if (!updated) throw new ApiError(404, "Resume not found");
  res.json(new ApiResponse(200, summary(updated), "Resume renamed"));
});

export const removeResume = asyncHandler(async (req, res) => {
  const filter = ownerFilter(req.user, req.params.id);
  const resume = await Resume.findOne(filter).select("resume_public_id").lean();
  if (!resume) throw new ApiError(404, "Resume not found");

  const [application, screening] = await Promise.all([
    JobApplication.exists({ resume_id: resume._id }),
    ResumeScreening.exists({ resume_id: resume._id }),
  ]);
  if (application || screening) throw new ApiError(409, "This resume is used by an application or screening and cannot be deleted.");

  if (resume.resume_public_id) {
    try {
      await deleteResume(resume.resume_public_id);
    } catch {
      throw new ApiError(502, "Could not delete the resume file. Try again.");
    }
  }

  await Resume.deleteOne(filter);
  res.status(204).end();
});

export const addResume = asyncHandler(async (req, res) => {
  const candidate = req.user && await User.findById(req.user).select("role").lean();
  if (!candidate || candidate.role !== "candidate") {
    throw new ApiError(403, "Only candidates can upload a resume");
  }
  const file = req.file;
  if (file && file.size > MAX_RESUME_BYTES) {
    throw new ApiError(413, "The resume must be 1 MB or smaller.");
  }
  if (!file || file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new ApiError(400, "Choose a valid PDF resume");
  }

  await Resume.init();
  const existing = await Resume.find({ belong_to: candidate._id }).select("slot").lean();
  if (existing.length >= MAX_RESUMES) throw new ApiError(409, maxLimitMessage);
  const occupied = new Set(existing.flatMap(resume => typeof resume.slot === "number" ? [resume.slot] : []));
  // Older uploads have no slot. Reserve part of the capacity for those records.
  const available = Array.from({ length: MAX_RESUMES - (existing.length - occupied.size) }, (_, i) => i + 1)
    .filter(slot => !occupied.has(slot));

  let uploaded;
  try {
    uploaded = await uploadResume(file.buffer);
  } catch {
    throw new ApiError(502, "Could not upload your resume");
  }

  const resume = new Resume({
    belong_to: candidate._id,
    resume_link: uploaded.url,
    resume_public_id: uploaded.publicId,
    name: file.originalname.replace(/\.pdf$/i, "").trim().slice(0, 100) || "Resume",
  });

  try {
    // The unique index arbitrates uploads that chose the same slot concurrently.
    for (const slot of available) {
      resume.slot = slot;
      try {
        await resume.save();
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === 11000) continue;
        throw error;
      }
      res.status(201).json(new ApiResponse(201, summary(resume), "Resume uploaded"));
      return;
    }
    throw new ApiError(409, maxLimitMessage);
  } catch (error) {
    const stored = await Resume.exists({ _id: resume._id }).catch(() => undefined);
    if (stored === null) {
      await deleteResume(uploaded.publicId).catch(() => console.error("Could not clean up a resume upload"));
    }
    throw error;
  }
});
