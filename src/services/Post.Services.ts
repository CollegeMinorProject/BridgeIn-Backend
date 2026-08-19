import { Post } from "../models/post.model";
import { uploadOnCloudinary } from "../utils/cloudinary";

export const createPostService = async (
  text: string,
  belong_to: string,
  image: string | null,
) => {
  if (image == null) {
    await Post.create({
      belong_to,
      text,
    });
  } else {
    console.log(image);
    let response: string | null = await uploadOnCloudinary(image);
    await Post.create({
      belong_to,
      text,
      image: response,
    });
  }
  return text;
};
