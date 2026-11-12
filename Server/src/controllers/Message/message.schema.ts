import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string({ error: "Receiver ID is required." }),
  text: z.string().optional(),
  image: z.string().optional(),
}).refine((data) => data.text || data.image, {
  message: "Either text or an image must be provided to send a message.",
});