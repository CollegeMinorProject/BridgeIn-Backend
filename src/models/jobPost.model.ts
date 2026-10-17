import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJobPost extends Document {
  employer_id: Types.ObjectId;
  title: string;
  description: string;
  requirements: string;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobPostSchema = new Schema<IJobPost>(
  {
    employer_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Job title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    requirements: {
      type: String,
      required: [true, "Job requirements are required"],
      trim: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
      index: true,
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
