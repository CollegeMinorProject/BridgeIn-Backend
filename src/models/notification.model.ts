import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "like",
  "comment",
  "follow",
  "job_status",
  "interview_invite",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

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
    reference_id: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export type NotificationDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof notificationSchema>;
export type INotification = mongoose.InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model("Notification", notificationSchema);
