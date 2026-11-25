import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const interviewSessionSchema = new mongoose.Schema(
  {
    application_id: { type: ObjectId, ref: "JobApplication", required: true, index: true },
    interviewer_id: { type: ObjectId, ref: "User", required: true },
    candidate_id: { type: ObjectId, ref: "User", required: true, index: true },
    workspace_room_id: { type: String, required: true, trim: true, unique: true },
    access_token_hash: { type: String, required: true, select: false },
    access_token_expiresAt: { type: Date, required: true },
    whiteboard_data: { type: String },
    employer_evaluation: { type: String },
    decision: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    scheduledAt: {
      type: Date,
      required: true,
      validate: {
        validator(this: mongoose.Document, value: Date) {
          if (this instanceof mongoose.Document && !this.isModified("scheduledAt")) return true;
          const now = Date.now();
          return value.getTime() >= now && value.getTime() <= now + sevenDays;
        },
        message: "Schedule the interview within the next seven days.",
      },
    },
    email_sent: { type: Boolean, default: false },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type IInterviewSession = mongoose.InferSchemaType<typeof interviewSessionSchema>;
export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
