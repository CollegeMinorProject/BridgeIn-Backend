import { Schema, model, InferSchemaType } from "mongoose";

const JOB_TYPES = ["full-time", "part-time", "internship", "contract"] as const;

const jobPostSchema = new Schema(
  {
    employer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Job title cannot exceed 150 characters"],
    },
    company_name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    job_type: {
      type: String,
      enum: {
        values: JOB_TYPES,
        message: "{VALUE} is not a valid job type",
      },
      required: [true, "Job type is required"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    requirements: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one requirement is required",
      },
    },
    skills_required: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// job feed: open jobs, newest first
jobPostSchema.index({ isOpen: 1, createdAt: -1, _id: -1 });

// search by keyword, with title weighted highest
jobPostSchema.index(
  { title: "text", description: "text", requirements: "text" },
  { weights: { title: 10, requirements: 3, description: 1 } },
);

// filter by skills (used for "jobs for you" matching)
jobPostSchema.index({ skills_required: 1 });

export type IJobPost = InferSchemaType<typeof jobPostSchema>;

export const JobPost = model<IJobPost>("JobPost", jobPostSchema);
