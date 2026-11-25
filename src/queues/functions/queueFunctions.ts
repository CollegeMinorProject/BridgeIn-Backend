import {
  Notification,
  NotificationType,
  NotificationReference,
} from "../../models/notification.model";

export type ForCreateNotification = {
  recipient_id: string;
  sender_id: string;
  type: NotificationType;
  reference_type?: NotificationReference;
  reference_id?: string;
};

export const createNotification = async (data: ForCreateNotification) => {
  if (data.recipient_id === data.sender_id) return null;
  return Notification.create(data);
};
