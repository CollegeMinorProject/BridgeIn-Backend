import mongoose from "mongoose";

export const JOB_TYPES = ["full-time", "part-time", "internship", "contract"] as const;
export type JobType = (typeof JOB_TYPES)[number];

const jobPostSchema = new mongoose.Schema(
  {
    posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company_name: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    job_type: { type: String, enum: JOB_TYPES, required: true },
    description: { type: String, required: true, trim: true },
    requirements: { type: String, required: true, trim: true },
    skills_required: { type: [{ type: String, trim: true }], default: [] },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);

jobPostSchema.index({ isOpen: 1, createdAt: -1 });
jobPostSchema.index({ title: "text", description: "text", requirements: "text" });

export type IJobPost = mongoose.InferSchemaType<typeof jobPostSchema>;
export const JobPost = mongoose.model("JobPost", jobPostSchema);
export default JobPost;
