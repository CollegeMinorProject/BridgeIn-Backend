import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "like",
  "comment",
  "follow",
  "job_status",
  "interview_invite",
  "direct_message",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_REFERENCES = ["Post", "JobApplication", "InterviewSession", "Conversation"] as const;
export type NotificationReference = (typeof NOTIFICATION_REFERENCES)[number];

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    reference_type: { type: String, enum: NOTIFICATION_REFERENCES },
    reference_id: { type: mongoose.Schema.Types.ObjectId, refPath: "reference_type" },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export type NotificationDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof notificationSchema>;
export type INotification = mongoose.InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model("Notification", notificationSchema);
