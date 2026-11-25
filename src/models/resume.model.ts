import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    belong_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume_link: {
      type: String,
      required: true,
      trim: true,
    },
    resume_public_id: { type: String, trim: true },
    name: { type: String, trim: true, maxlength: 100 },
    slot: { type: Number },
    extracted_text: { type: String },
  },
  {
    timestamps: { createdAt: "uploadedAt", updatedAt: false } as const,
  },
);

resumeSchema.index({ belong_to: 1, slot: 1 }, {
  unique: true,
  partialFilterExpression: { slot: { $type: "number" } },
});

export type ResumeDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof resumeSchema>;
export type IResume = mongoose.InferSchemaType<typeof resumeSchema>;
export const Resume = mongoose.model("Resume", resumeSchema);
