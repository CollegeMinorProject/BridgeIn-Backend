import { Comment } from "../../models/comment.model";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";

export const addComment = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  const { text } = req.body;
  const commenterId = req.user;
  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }
  const comment = await Comment.create({
    text,
    postid: postId,
    commenter_id: commenterId,
  });
  return res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const getCommentsByPost = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  //use Pagination from here get Limit and page from params if not provided take default Limit 30 and page 1
  const comments = await Comment.find({ postid: postId })
    .populate("commenter_id", "name profilePic")
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments retrieved"));
});

export const deleteComment = asyncHandler(async (req: any, res: any) => {
  //only get route will use params other will use body to send data also use jod to check if comment Id is string Or not
  const { commentId } = req.params;
  const commenterId = req.user;
  //no need to check is login route will hand this
  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }
  // move this to service function
  // check if post owner is trying to delete this if this is post owner we will allow to delete the comment
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    commenter_id: commenterId,
  });
  if (!comment) throw new ApiError(404, "Comment not found or unauthorized");
  return res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});
