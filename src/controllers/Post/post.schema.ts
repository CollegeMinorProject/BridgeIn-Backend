import { z } from "zod";
export const createPostSchema = z.object({
  text: z.string().trim().max(300).min(1),
});
