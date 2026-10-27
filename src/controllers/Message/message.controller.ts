import { Request, Response } from "express";
import { getIO, getReceiverSocketId } from "../../config/socket.config";
import Message from "../../models/message.model";
import Conversation from "../../models/conversation.model";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, image } = req.body;
    const receiverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required." });
    }

    const senderId = (req as any).user?._id;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Find existing conversation or create a new one
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

    // 2. Create the message using your team's schema fields
    const newMessage = new Message({
      conversation_id: conversation._id,
      sender_id: senderId,
      text: text || "",
      attachmentUrl: image || null,
    });

    await newMessage.save();

    // 3. Format the message to match what the React frontend expects
    const formattedMessage = {
      _id: newMessage._id,
      senderId: newMessage.sender_id,
      text: newMessage.text,
      image: newMessage.attachmentUrl,
      createdAt: newMessage.createdAt,
    };

    // 4. Real-Time Socket.io Delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      const io = getIO();
      io.to(receiverSocketId).emit("newMessage", formattedMessage);
    }

    return res.status(201).json(formattedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userToChatId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const myId = (req as any).user?._id;

    if (!userToChatId || !myId) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    // 1. Find the conversation document
    const conversation = await Conversation.findOne({
      $or: [
        { participant1_id: myId, participant2_id: userToChatId },
        { participant1_id: userToChatId, participant2_id: myId },
      ],
    });

    if (!conversation) {
      // If no conversation exists yet, return an empty array
      return res.status(200).json([]);
    }

    // 2. Fetch all messages in this conversation, sorted chronologically
    const messages = await Message.find({ conversation_id: conversation._id }).sort({ createdAt: 1 });

    // 3. Map database fields to the frontend's expected properties
    const formattedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      senderId: msg.sender_id,
      text: msg.text,
      image: msg.attachmentUrl,
      createdAt: msg.createdAt,
    }));

    return res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};