import { Comment } from '../../models/comment.model';
import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { APIError } from '../../utils/ErrorHandling.ts/APIError';
import { APIResponse } from '../../utils/ErrorHandling.ts/APIResponse';

export const addComment = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  const { text } = req.body;

  const comment = await Comment.create({ text, postid: postId, commenter_id: req.user?._id });
  return res.status(201).json(new APIResponse(201, comment, "Comment added"));
});

export const getCommentsByPost = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  const comments = await Comment.find({ postid: postId }).populate('commenter_id', 'name profilePic').sort({ createdAt: -1 });
  return res.status(200).json(new APIResponse(200, comments, "Comments retrieved"));
});

export const updateComment = asyncHandler(async (req: any, res: any) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const comment = await Comment.findOneAndUpdate(
    { _id: commentId, commenter_id: req.user?._id },
    { text },
    { new: true }
  );

  if (!comment) throw new APIError(404, "Comment not found or unauthorized");
  return res.status(200).json(new APIResponse(200, comment, "Comment updated"));
});

export const deleteComment = asyncHandler(async (req: any, res: any) => {
  const { commentId } = req.params;
  const comment = await Comment.findOneAndDelete({ _id: commentId, commenter_id: req.user?._id });
  
  if (!comment) throw new APIError(404, "Comment not found or unauthorized");
  return res.status(200).json(new APIResponse(200, null, "Comment deleted"));
});