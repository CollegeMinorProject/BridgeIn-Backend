import { Types } from "mongoose";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
// importing service
import {
  createCommentService,
  getCommentsByPostService,
  updateCommentService,
  deleteCommentService,
} from "../../services/comment.service";

function validPostId(postId: unknown) {
  if (typeof postId !== "string" || !Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }
  return postId;
}

export const addComment = asyncHandler(async (req, res) => {
  const postId = validPostId(req.params.postId);
  if (!req.user) throw new ApiError(401, "Unauthorized");
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text || text.length > 1000) throw new ApiError(400, "Enter a comment of up to 1,000 characters.");
  const comment = await createCommentService(text, postId, req.user);
  res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const getCommentsByPost = asyncHandler(async (req, res) => {
  const postId = validPostId(req.params.postId);
  const page = Math.max(1, Math.min(100_000, Number.parseInt(String(req.query.page), 10) || 1));
  const before = req.query.before;
  if (before !== undefined && typeof before !== "string") throw new ApiError(400, "Invalid comment cursor");
  const result = await getCommentsByPostService(postId, page, before);
  res.json(new ApiResponse(200, result, "Comments retrieved"));
});

export const updateComment = asyncHandler(async (req: any, res: any) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const commenterId = req.user;

  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }

  const comment = await updateCommentService(commentId, commenterId, text);

  if (!comment) throw new ApiError(404, "Comment not found or unauthorized");
  return res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

export const deleteComment = asyncHandler(async (req: any, res: any) => {
  //only get route will use params other will use body to send data also use jod to check if comment Id is string Or not
  const { commentId } = req.params;
  const commenterId = req.user;
  //no need to check is login route will hand this
  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }

  const comment = await deleteCommentService(commentId, commenterId);

  if (!comment) throw new ApiError(404, "Comment not found or unauthorized");
  return res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});
