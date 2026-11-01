import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { createPostSchema } from "./post.schema";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { createPostService } from "../../services/Post.Services";
import like from "../../models/like.model";
import { Post } from "../../models/post.model";
import { User } from "../../models/user.model";

//create post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  let file = req.file?.path;
  let result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(403, "Invalid data");
  }
  try {
    await createPostService(result.data.text, req.user, file);
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messsage: "Post created Sucessfully" },
        "reaching",
      ),
    );
});
// Like a post
export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const userId = req.user;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const existingLike = await like.findOne({
    postid: postId,
    LikedBy: userId,
  });

  if (existingLike) {
    throw new ApiError(409, "You have already liked this post");
  }

  await like.create({
    postid: postId,
    LikedBy: userId,
  });

  return res.status(201).json(
    new ApiResponse(201, null, "Post liked successfully"),
  );
});


// Unlike a post
export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const userId = req.user;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const post = await Post.findById(postId);

  if (!post) {
     throw new ApiError(404, "Post not found");
  }
  const deletedLike = await like.findOneAndDelete({
    postid: postId,
    LikedBy: userId,
  });

  if (!deletedLike) {
    throw new ApiError(404, "Like not found");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Post unliked successfully"),
  );
});


// Get like details
export const getLikeDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const postId = req.params.postId as string;

    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const likes = await like.find({ postid: postId });

    const users = await User.find(
      { _id: { $in: likes.map((item: any) => item.LikedBy) } },
      "name avatar",
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalLikes: likes.length,
          users,
        },
        "Like details retrieved successfully",
      ),
    );
  },
);
//delete post
//update post
//comment on post
//get comment in bunch
//delete comment
