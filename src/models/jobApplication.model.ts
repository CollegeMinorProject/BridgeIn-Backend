import { Schema, model, InferSchemaType } from "mongoose";

export const APPLICATION_STATUSES = ["applied", "accepted", "interview_scheduled", "rejected", "cancelled", "interviewing", "hired"] as const;

const jobApplicationSchema = new Schema(
  {
    job_post_id: {
      type: Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume_id: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    screening_id: {
      type: Schema.Types.ObjectId,
      ref: "ResumeScreening",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: "{VALUE} is not a valid application status",
      },
      default: "applied",
    },
    acceptedAt: { type: Date },
    interviewAt: { type: Date },
  },
  {
    timestamps: { createdAt: "appliedAt", updatedAt: true } as const,
  },
);

// one application per candidate per job (also serves job_post_id lookups)
jobApplicationSchema.index(
  { job_post_id: 1, candidate_id: 1 },
  { unique: true },
);

// recruiter view: applications for a job filtered by status
jobApplicationSchema.index({ job_post_id: 1, status: 1, appliedAt: -1 });

export type IJobApplication = InferSchemaType<typeof jobApplicationSchema>;

export const JobApplication = model(
  "JobApplication",
  jobApplicationSchema,
);
