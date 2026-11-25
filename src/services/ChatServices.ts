import { Types } from "mongoose";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { User } from "../models/user.model";
import { Follower } from "../models/follow.model";
import { isfollowing } from "../dao/User/follower.dao";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";

const batchSize = 25;
const asId = (id: unknown) => {
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw new ApiError(400, "Invalid ID");
  }
  return new Types.ObjectId(id);
};

const membership = (userId: string) => ({
  $or: [{ participant1_id: asId(userId) }, { participant2_id: asId(userId) }],
});

async function findThread(userId: string, conversationId: unknown) {
  const thread = await Conversation.findOne({ _id: asId(conversationId), ...membership(userId) }).lean();
  if (!thread) throw new ApiError(404, "Conversation not found");
  return thread;
}

type Thread = Awaited<ReturnType<typeof findThread>>;

function otherId(thread: Pick<Thread, "participant1_id" | "participant2_id">, userId: string) {
  return String(thread.participant1_id) === userId
    ? String(thread.participant2_id)
    : String(thread.participant1_id);
}

function formatMessage(message: {
  _id: Types.ObjectId;
  sender_id: Types.ObjectId;
  conversation_id: Types.ObjectId;
  text?: string | null;
  attachment_url?: string | null;
  createdAt: Date;
}) {
  return {
    _id: String(message._id),
    senderId: String(message.sender_id),
    conversationId: String(message.conversation_id),
    text: message.text ?? "",
    image: message.attachment_url,
    createdAt: message.createdAt,
  };
}

async function summarize(threads: Thread[], userId: string) {
  if (!threads.length) return [];
  const [users, counts] = await Promise.all([
    User.find({ _id: { $in: threads.map(thread => otherId(thread, userId)) } })
      .select("name avatar").lean(),
    Message.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { conversation_id: { $in: threads.map(thread => thread._id) }, sender_id: { $ne: asId(userId) }, isRead: false } },
      { $group: { _id: "$conversation_id", count: { $sum: 1 } } },
    ]),
  ]);
  const usersById = new Map(users.map(user => [String(user._id), user]));
  const countsById = new Map(counts.map(count => [String(count._id), count.count]));

  return threads.map(thread => {
    const participantId = otherId(thread, userId);
    const participant = usersById.get(participantId);
    const id = String(thread._id);
    return {
      id,
      participant: { id: participantId, name: participant?.name ?? "Deleted user", avatar: participant?.avatar },
      lastMessage: thread.last_message_text ?? "",
      updatedAt: thread.last_message_at ?? thread.createdAt,
      unreadCount: countsById.get(id) ?? 0,
    };
  });
}

export async function chatContacts(userId: string) {
  const threads = await Conversation.find(membership(userId)).select("participant1_id participant2_id").lean();
  return [...new Set(threads.map(thread => otherId(thread, userId)))];
}

export async function getConversations(userId: string) {
  const threads = await Conversation.find(membership(userId)).sort({ last_message_at: -1, _id: -1 }).lean();
  return summarize(threads, userId);
}

export async function getFollowedUsers(userId: string) {
  const follows = await Follower.find({ followed_by: asId(userId) }).select("main_id").lean();
  const users = await User.find({ _id: { $in: follows.map(follow => follow.main_id) } })
    .select("name avatar").sort({ name: 1 }).lean();
  return users.map(user => ({ id: String(user._id), name: user.name, avatar: user.avatar }));
}

export async function fetchMessages(userId: string, conversationId: unknown, beforeMessageId?: unknown) {
  const thread = await findThread(userId, conversationId);
  const messages = await Message.find({
    conversation_id: thread._id,
    ...(beforeMessageId === undefined ? {} : { _id: { $lt: asId(beforeMessageId) } }),
  }).sort({ _id: -1 }).limit(batchSize + 1).lean();

  return { messages: messages.slice(0, batchSize).reverse().map(formatMessage), hasMore: messages.length > batchSize };
}

export async function markRead(userId: string, conversationId: unknown) {
  const thread = await findThread(userId, conversationId);
  await Message.updateMany({ conversation_id: thread._id, sender_id: { $ne: asId(userId) }, isRead: false }, { $set: { isRead: true } });
  return String(thread._id);
}

export async function saveChatMessage(userId: string, input: {
  conversationId?: unknown;
  receiverId?: unknown;
  text?: unknown;
  image?: string;
}) {
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if ((!text && !input.image) || text.length > 4000) throw new ApiError(400, "Enter a message of up to 4,000 characters");

  let thread: Thread;
  if (input.conversationId !== undefined) {
    thread = await findThread(userId, input.conversationId);
  } else {
    const receiverId = asId(input.receiverId).toHexString();
    if (userId === receiverId) throw new ApiError(400, "Choose another participant");
    const [first, second] = [userId, receiverId].sort().map(asId);
    const pair = { participant1_id: first, participant2_id: second };
    const existing = await Conversation.findOne(pair).lean();
    if (existing) {
      thread = existing;
    } else {
      const [follows, receiver] = await Promise.all([isfollowing(userId, receiverId), User.exists({ _id: receiverId })]);
      if (!receiver || !follows) throw new ApiError(403, "Follow this person before starting a conversation");
      try {
        thread = await Conversation.findOneAndUpdate(pair, { $setOnInsert: pair }, { upsert: true, new: true }).lean().orFail();
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
        thread = await Conversation.findOne(pair).lean().orFail();
      }
    }
  }

  const message = await Message.create({
    conversation_id: thread._id, sender_id: asId(userId), text, attachment_url: input.image,
  });
  const updated = await Conversation.findById(thread._id).lean().orFail();
  const receiverId = otherId(updated, userId);
  const [[senderThread], [receiverThread]] = await Promise.all([summarize([updated], userId), summarize([updated], receiverId)]);
  return { message: formatMessage(message), receiverId, senderThread, receiverThread };
}
