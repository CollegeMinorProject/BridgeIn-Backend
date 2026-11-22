import type { Server, Socket } from "socket.io";
import { chatContacts, fetchMessages, getConversations, getFollowedUsers, markRead, saveChatMessage } from "../services/ChatServices";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";

export const chatRoom = (userId: string) => `chat-user:${userId}`;

export function publishMessage(io: Server, userId: string, result: Awaited<ReturnType<typeof saveChatMessage>>, except?: string) {
  const { message, senderThread, receiverThread, receiverId } = result;
  const senderRoom = chatRoom(userId);
  const receiverRoom = chatRoom(receiverId);
  const senderEvent = { message, conversation: senderThread, online: io.sockets.adapter.rooms.has(receiverRoom) };
  io.to(receiverRoom).emit("receive_message", {
    message,
    conversation: receiverThread,
    online: io.sockets.adapter.rooms.has(senderRoom),
  });
  const sender = io.to(senderRoom);
  (except ? sender.except(except) : sender).emit("receive_message", senderEvent);
  return senderEvent;
}

export async function publishPresence(io: Server, userId: string, online: boolean, isOnline: (id: string) => boolean) {
  try {
    const recipients = await chatContacts(userId);
    if (isOnline(userId) !== online || !recipients.length) return;
    io.to(recipients.map(chatRoom)).emit(online ? "user_online" : "user_offline", { userId });
  } catch (error) {
    console.error("Could not update chat presence", error);
  }
}

export function registerChatEvents(io: Server, socket: Socket, userId: string, isOnline: (id: string) => boolean) {
  function on<T>(event: string, handler: (payload: Record<string, unknown>) => Promise<T>) {
    socket.on(event, async (payload: unknown, acknowledge: unknown) => {
      if (typeof acknowledge !== "function") return;
      try {
        const fields = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
        acknowledge({ data: await handler(fields) });
      } catch (error) {
        if (!(error instanceof ApiError)) console.error("Chat request failed", error);
        acknowledge({ error: error instanceof ApiError ? error.message : "Chat request failed. Try again." });
      }
    });
  }

  on("get_conversations", async () => {
    const conversations = await getConversations(userId);
    return { conversations, onlineIds: conversations.map(thread => thread.participant.id).filter(isOnline) };
  });
  on("get_followed_users", () => getFollowedUsers(userId));
  on("fetch_messages", ({ conversationId, beforeMessageId }) => fetchMessages(userId, conversationId, beforeMessageId));
  on("mark_read", async ({ conversationId }) => {
    const id = await markRead(userId, conversationId);
    socket.to(chatRoom(userId)).emit("conversation_read", { conversationId: id });
    return { conversationId: id };
  });
  on("create_conversation", async ({ receiverId, initialMessage }) => {
    const result = await saveChatMessage(userId, { receiverId, text: initialMessage });
    return publishMessage(io, userId, result, socket.id);
  });
  on("send_message", async ({ conversationId, content, text }) => {
    const result = await saveChatMessage(userId, { conversationId, text: content ?? text });
    return publishMessage(io, userId, result, socket.id);
  });
}
