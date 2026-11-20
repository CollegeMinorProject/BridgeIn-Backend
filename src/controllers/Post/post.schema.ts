import { z } from "zod";
export const createPostSchema = z.object({
  text: z.string().max(300).min(1),
});
export const updatePostSchema = z.object({
  text: z.string()
    .min(1, "Post text cannot be empty")
    .max(300, "Post text cannot exceed 300 characters"), 
});
