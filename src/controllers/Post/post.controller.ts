import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { createPostSchema } from "./post.schema";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { createPostService } from "../../services/Post.Services";
import like from "../../models/like.model";
import { Post } from "../../models/post.model";
import { User } from "../../models/user.model";
import { Types } from "mongoose";

//create post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  let file = req.file?.path;
  let result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(403, "Invalid data");
  }
  if (!req.user) throw new ApiError(401, "Unauthorized");
  await createPostService(result.data.text, req.user, file);
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
    post_id: postId,
    liked_by: userId,
  });

  if (existingLike) {
    throw new ApiError(409, "You have already liked this post");
  }

  await like.create({
    post_id: postId,
    liked_by: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, null, "Post liked successfully"));
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
    post_id: postId,
    liked_by: userId,
  });

  if (!deletedLike) {
    throw new ApiError(404, "Like not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post unliked successfully"));
});

// Get like details
export const likeAndDislike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user;
  const liked = req.body?.liked;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (typeof postId !== "string" || !Types.ObjectId.isValid(postId) || typeof liked !== "boolean") {
    throw new ApiError(400, "Invalid post or like state");
  }
  if (!await Post.exists({ _id: postId })) throw new ApiError(404, "Post not found");

  const pair = { post_id: postId, liked_by: userId };
  if (liked) {
    await like.init();
    try {
      await like.updateOne(pair, { $setOnInsert: pair }, { upsert: true });
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
    }
  } else {
    await like.deleteOne(pair);
  }
  const [likesCount, ownLike] = await Promise.all([
    like.countDocuments({ post_id: postId }),
    like.exists(pair),
  ]);
  res.json(new ApiResponse(200, { likesCount, isLikedByMe: Boolean(ownLike) }));
});

export const getLikeDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const postId = req.params.postId as string;

    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const likes = await like.find({ post_id: postId });

    const users = await User.find(
      { _id: { $in: likes.map((item) => item.liked_by) } },
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
