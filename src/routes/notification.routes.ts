import { Router } from "express";
import { Types } from "mongoose";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { Notification } from "../models/notification.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../utils/ErrorHandling.ts/asyncHandler";

const router = Router();
const pageSize = 25;

router.use(isLoggedInMiddleWare);

async function unreadCounts(recipientId: string) {
  const unread = { recipient_id: recipientId, isRead: false };
  const [total, jobs] = await Promise.all([
    Notification.countDocuments(unread),
    Notification.countDocuments({ ...unread, type: "job_status" }),
  ]);
  return { total, jobs };
}

router.get("/", asyncHandler(async (req, res) => {
  const recipientId = req.user;
  if (!recipientId) throw new ApiError(401, "Not authorised");
  const before = req.query.before;
  if (before !== undefined && (typeof before !== "string" || !Types.ObjectId.isValid(before))) {
    throw new ApiError(400, "Invalid notification cursor");
  }

  const [documents, unread] = await Promise.all([
    Notification.find({
      recipient_id: recipientId,
      ...(before ? { _id: { $lt: before } } : {}),
    }).sort({ _id: -1 }).limit(pageSize + 1).lean(),
    unreadCounts(recipientId),
  ]);

  const page = documents.slice(0, pageSize);
  const senders = await User.find({ _id: { $in: page.map(item => item.sender_id) } }).select("name").lean();
  const names = new Map(senders.map(sender => [String(sender._id), sender.name]));
  const items = page.map(item => ({
    id: String(item._id),
    type: item.type,
    reference_type: item.reference_type,
    reference_id: item.reference_id,
    senderName: names.get(String(item.sender_id)),
    isRead: item.isRead,
    createdAt: item.createdAt,
  }));
  const nextCursor = documents.length > pageSize ? items.at(-1)?.id ?? null : null;
  res.json(new ApiResponse(200, { items, unread, nextCursor }));
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  const recipientId = req.user;
  if (!recipientId) throw new ApiError(401, "Not authorised");
  const id = req.params.id;
  if (typeof id !== "string" || !Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid notification ID");

  const result = await Notification.updateOne(
    { _id: id, recipient_id: recipientId },
    { $set: { isRead: true } },
  );
  if (!result.matchedCount) throw new ApiError(404, "Notification not found");
  res.json(new ApiResponse(200, { unread: await unreadCounts(recipientId) }));
}));

export default router;
