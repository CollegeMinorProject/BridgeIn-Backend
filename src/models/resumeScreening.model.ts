import mongoose from "mongoose";

const resumeScreeningSchema = new mongoose.Schema(
  {
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    // compatibility score between the resume and the job description
    score: {
      type: Number,
      validate: Number.isInteger,
      required: true,
      min: [0, "Score cannot be below 0"],
      max: [100, "Score cannot exceed 100"],
    },
    // Gemini improvement suggestions
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    missing_skills: {
      type: [{ type: String, trim: true }],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// latest screenings of a candidate for a given job
resumeScreeningSchema.index({ candidate_id: 1, job_post_id: 1, createdAt: -1 });

export type ResumeScreeningDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof resumeScreeningSchema>;
export type IResumeScreening = mongoose.InferSchemaType<
  typeof resumeScreeningSchema
>;
export const ResumeScreening = mongoose.model(
  "ResumeScreening",
  resumeScreeningSchema,
);
