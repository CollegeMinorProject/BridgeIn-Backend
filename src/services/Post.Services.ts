import { Post } from "../models/post.model";
import { uploadOnCloudinary } from "../utils/cloudinary";

export const createPostService = async (
  text: string,
  belong_to: string,
  image: string | undefined,
) => {
  if (!image) {
    await Post.create({
      belong_to,
      text,
    });
  } else {
    let response: string | null = await uploadOnCloudinary(image);
    await Post.create({
      belong_to,
      text,
      image: response,
    });
  }
  return text;
};
