import { Request, Response } from "express";
import { getIO, getReceiverSocketId } from "../../config/socket.config";
// Note: You will need to import your actual Message model here later
// import Message from "../../models/message.model";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { text, image } = req.body;
    const receiverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required." });
    }

    // Assuming your isLoggedIn middleware attaches the user to req.user
    const senderId = (req as any).user?._id;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Create and save the message in MongoDB (Placeholder logic)
    /*
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image,
    });
    await newMessage.save();
    */
    
    // Temporary mock message until we link your database model
    const newMessage = { senderId, receiverId, text, image, createdAt: new Date() };

    // 2. Real-Time Socket.io Delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      const io = getIO();
      // Send the event strictly to the specific user's connection
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};