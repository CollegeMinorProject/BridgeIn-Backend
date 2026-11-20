import { Post } from "../models/post.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { postCleanupEnqueue } from "../queues/producer/producer";

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

export const deletedPostService = async (postId: string, userId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Ensure that the user deleting the post is the original author
  if (post.belong_to.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  const imageUrl = post.image; // Capture the image URL before deleting the document

  // Delete the post immediately so the user gets a fast API response
  await Post.findByIdAndDelete(postId);

  // Offload cascading DB deletes (Likes/Comments) and Cloudinary cleanup to Redis
  await postCleanupEnqueue("delete-post-cleanup", { postId, imageUrl });
};

export const updatePostService = async (
  postId: string, 
  userId: string, 
  newText: string,
  newImage?: string // Added support for updating the post image
) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  
  // Ensure the user updating the post is the original author of the post
  if (post.belong_to.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this post");
  }
  
  post.text = newText;

  // If the user uploaded a new image, handle the replacement via BullMQ
  if (newImage) {
    const oldImageUrl = post.image;
    post.image = await uploadOnCloudinary(newImage);
    
    if (oldImageUrl) {
      await postCleanupEnqueue("update-post-cleanup", { oldImageUrl });
    }
  }

  await post.save();
  
  return post;
};