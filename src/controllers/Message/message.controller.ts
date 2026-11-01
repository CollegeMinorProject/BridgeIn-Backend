import { Request, Response } from "express";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { sendMessageSchema } from "./message.schema";
import { sendMessageService, getMessagesService } from "../../services/MessageServices";

export const sendMessage = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Validate body and extract receiverId using Zod safeParse
    const parsedData = sendMessageSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      throw new ApiError(400, "Invalid Request");
    }

    const { receiverId, text, image } = parsedData.data;
    const senderId = (req as any).user;
    // 2. Pass validated data to the Service Layer
    const message = await sendMessageService(senderId, receiverId, text, image);

    // 3. Return standardized ApiResponse
    return res
      .status(201)
      .json(new ApiResponse(201, message, "Message sent successfully"));
  }
);

export const getMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const userToChatId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const myId = (req as any).user?._id;

    if (!userToChatId || !myId) {
      throw new ApiError(400, "Missing user IDs");
    }

    // Extract pagination limit from query params (e.g., /message/123?limit=20)
    // Defaults to 50 if no limit is provided in the request
    const limit = parseInt(req.query.limit as string) || 50;

    // Call the newly extracted service layer
    const { messages, totalMessages } = await getMessagesService(myId, userToChatId, limit);
    return res
      .status(200)
      .json(new ApiResponse(200, { messages, totalMessages }, "Messages retrieved successfully"));
  }
);