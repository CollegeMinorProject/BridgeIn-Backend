import { z } from "zod";
export const createPostSchema = z.object({
  text: z.string().max(300).min(1),
});
