import {
  Notification,
  NotificationType,
} from "../../models/notification.model";
import like from "../../models/like.model";
import { Comment } from "../../models/comment.model";
import { deleteFromCloudinary } from "../../utils/cloudinary";

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

export const processPostDeletionCleanup = async (data: { postId: string; imageUrl?: string }) => {
  const { postId, imageUrl } = data;

  try {
    // 1. Delete associated comments and likes concurrently
    await Promise.all([
      like.deleteMany({ postid: postId }),
      Comment.deleteMany({ postid: postId }),
    ]);

    // 2. Remove the image from Cloudinary if the post had one
    if (imageUrl) {
      await deleteFromCloudinary(imageUrl);
    }
  } catch (error) {
    console.error("Error in post deletion cleanup job:", error);
    throw error; // Throwing the error tells BullMQ the job failed so it can retry or log it
  }
};

export const processPostUpdateCleanup = async (data: { oldImageUrl: string }) => {
  try {
    // If a user updates a post with a new image, delete the old one in the background
    if (data.oldImageUrl) {
      await deleteFromCloudinary(data.oldImageUrl);
    }
  } catch (error) {
    console.error("Error in post update cleanup job:", error);
    throw error;
  }
};