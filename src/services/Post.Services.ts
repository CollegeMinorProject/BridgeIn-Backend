import { Post } from "../models/post.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { uploadOnCloudinary } from "../utils/cloudinary";

export const createPostService = async (text: string, belong_to: string, image?: string) => {
  const uploaded = image ? await uploadOnCloudinary(image) : null;
  if (image && !uploaded) throw new ApiError(502, "Could not upload post image");
  await Post.create({ belong_to, text, image: uploaded?.url, image_public_id: uploaded?.publicId });
  return text;
};
