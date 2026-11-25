import { Types } from "mongoose";
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";
import { Post } from "../models/post.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";

export const createCommentService = async (text: string, postId: string, commenterId: string) => {
  const [post, author] = await Promise.all([
    Post.exists({ _id: postId }),
    User.findById(commenterId).select("name avatar").lean(),
  ]);
  if (!post) throw new ApiError(404, "Post not found");
  if (!author) throw new ApiError(401, "Unauthorized");
  const comment = await Comment.create({ text, post_id: postId, commenter_id: commenterId });
  return { ...comment.toObject(), commenter_id: author };
};

export const getCommentsByPostService = async (postId: string, page: number, before?: string) => {
  const limit = 30;
  const skip = before ? 0 : (page - 1) * limit;
  const postFilter = { post_id: postId };
  let older = {};
  if (before) {
    const [timestamp, id, extra] = before.split("|");
    const date = new Date(timestamp);
    if (extra !== undefined || !Number.isFinite(date.getTime()) || !Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid comment cursor");
    }
    older = { $or: [{ createdAt: { $lt: date } }, { createdAt: date, _id: { $lt: id } }] };
  }

  const [records, totalComments] = await Promise.all([
    Comment.find({ ...postFilter, ...older })
      .populate("commenter_id", "name avatar")
      .sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit + 1).lean(),
    Comment.countDocuments(postFilter),
  ]);
  const comments = records.slice(0, limit);
  const last = comments.at(-1);
  return {
    comments,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
    currentPage: page,
    nextCursor: records.length > limit && last ? `${last.createdAt.toISOString()}|${last._id}` : null,
  };
};

export const updateCommentService = async (commentId: string, commenterId: string, text: string) => {
  return await Comment.findOneAndUpdate(
    { _id: commentId, commenter_id: commenterId },
    { text },
    { new: true }
  );
};

export const deleteCommentService = async (commentId: string, commenterId: string) => {
  return await Comment.findOneAndDelete({ _id: commentId, commenter_id: commenterId });
};