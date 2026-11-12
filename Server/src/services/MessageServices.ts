import Message from "../models/message.model";
import Conversation from "../models/conversation.model";
import { getIO, getReceiverSocketId } from "../config/socket.config";

export const sendMessageService = async (
  senderId: string,
  receiverId: string,
  text?: string,
  image?: string
) => {
  let conversation = await Conversation.findOne({
    $or: [
      { participant1_id: senderId, participant2_id: receiverId },
      { participant1_id: receiverId, participant2_id: senderId },
    ],
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participant1_id: senderId,
      participant2_id: receiverId,
    });
  }

  const newMessage = new Message({
    conversation_id: conversation._id,
    sender_id: senderId,
    text: text || "",
    attachmentUrl: image || null,
  });

  await newMessage.save();

  const formattedMessage = {
    _id: newMessage._id,
    senderId: newMessage.sender_id,
    text: newMessage.text,
    image: newMessage.attachmentUrl,
    createdAt: newMessage.createdAt,
  };

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    const io = getIO();
    io.to(receiverSocketId).emit("newMessage", formattedMessage);
  }

  return formattedMessage;
};

// New Service to handle fetching paginated messages
export const getMessagesService = async (
  myId: string,
  userToChatId: string,
  limit: number
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
      .limit(limit)
  ]);

  const formattedMessages = messages
    .map((msg: any) => ({
      _id: msg._id,
      senderId: msg.sender_id,
      text: msg.text,
      image: msg.attachmentUrl,
      createdAt: msg.createdAt,
    }))
  return { messages: formattedMessages, totalMessages };
};