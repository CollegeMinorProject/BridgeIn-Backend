// File: src/services/comment.service.ts
import { Comment } from '../models/comment.model';

export const createCommentService = async (text: string, postId: string, commenterId: string) => {
  return await Comment.create({ text, postid: postId, commenter_id: commenterId });
};

export const getCommentsByPostService = async (postId: string, page: number) => {
  const limit = 30;  // page limit
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ postid: postId })
    .populate('commenter_id', 'name profilePic')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // total no of comments for pagination and total pages retrieving
  const totalComments = await Comment.countDocuments({ postid: postId });
  const totalPages = Math.ceil(totalComments / limit);

  return { comments, totalComments, totalPages, currentPage: page };
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