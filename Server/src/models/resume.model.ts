import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    belong_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeLink: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ResumeDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof resumeSchema>;
export type IResume = mongoose.InferSchemaType<typeof resumeSchema>;
export const Resume = mongoose.model("Resume", resumeSchema);
