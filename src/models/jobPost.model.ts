import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJobPost extends Document {
  employer_id: Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  image: string; // <-- ADDED: Image field in interface
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
] as const;
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
      type: [String],
      required: [true, "Job requirements are required"],
      trim: true,
    },
    image: {
      // <-- ADDED: Image field in Schema (Mandatory)
      type: String,
      required: [true, "Job image is mandatory"],
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

jobPostSchema.index({ isOpen: 1, createdAt: -1 });
jobPostSchema.index({
  title: "text",
  description: "text",
  requirements: "text",
});

export const JobPost = mongoose.model<IJobPost>("JobPost", jobPostSchema);
export default JobPost;
