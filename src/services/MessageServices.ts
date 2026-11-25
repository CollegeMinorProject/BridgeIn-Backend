import Message from "../models/message.model";
import Conversation from "../models/conversation.model";
import { getIO } from "../config/socket.config";
import { publishMessage } from "../config/chatSocket";
import { saveChatMessage } from "./ChatServices";

export const sendMessageService = async (
  senderId: string,
  receiverId: string,
  text?: string,
  image?: string,
) => {
  const result = await saveChatMessage(senderId, { receiverId, text, image });
  return publishMessage(getIO(), senderId, result).message;
};

// New Service to handle fetching paginated messages
export const getMessagesService = async (
  myId: string,
  userToChatId: string,
  limit: number,
) => {
  const conversation = await Conversation.findOne({
    $or: [
      { participant1_id: myId, participant2_id: userToChatId },
      { participant1_id: userToChatId, participant2_id: myId },
    ],
  });

  if (!conversation) {
    return { messages: [], totalMessages: 0 };
  }

  // Count total messages in this specific conversation
  //used promise.all to handle totalmessages and messages simultaneously
  const [totalMessages, messages] = await Promise.all([
    Message.countDocuments({ conversation_id: conversation._id }),
    Message.find({ conversation_id: conversation._id })
      .sort({ createdAt: -1 })
      .limit(limit),
  ]);

  const formattedMessages = messages.map((msg: any) => ({
    _id: msg._id,
    senderId: msg.sender_id,
    text: msg.text,
    image: msg.attachment_url,
    createdAt: msg.createdAt,
  }));
  return { messages: formattedMessages, totalMessages };
};
