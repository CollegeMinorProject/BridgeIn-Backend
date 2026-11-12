import {
  Notification,
  NotificationType,
} from "../../models/notification.model";

export type ForCreateNotification = {
  recipient_id: string;
  sender_id: string;
  type: NotificationType;
};

export const createNotification = async (data: ForCreateNotification) => {
  try {
    if (data.recipient_id === data.sender_id) {
      return null;
    }
    const notification = new Notification({
      recipient_id: data.recipient_id,
      sender_id: data.sender_id,
      type: data.type,
    });
    const savedNotification = await notification.save();
    return savedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};
