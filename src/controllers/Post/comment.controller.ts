import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { ApiError } from '../../utils/ErrorHandling.ts/APIError';
import { ApiResponse } from '../../utils/ErrorHandling.ts/APIResponse';
// importing service
import { 
  createCommentService, 
  getCommentsByPostService, 
  updateCommentService, 
  deleteCommentService 
} from '../../services/comment.service';

export const addComment = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  const { text } = req.body;
  const commenterId = req.user;

  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }

  // logic -> service point
  const comment = await createCommentService(text, postId, commenterId);
  return res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const getCommentsByPost = asyncHandler(async (req: any, res: any) => {
  const { postId } = req.params;
  
  // by default page 1
  const page = parseInt(req.query.page as string) || 1;
  
  //service call
  const result = await getCommentsByPostService(postId, page);
    
  return res.status(200).json(new ApiResponse(200, result, "Comments retrieved"));
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
  const { commentId } = req.params;
  const commenterId = req.user;

  if (!commenterId) {
    throw new ApiError(401, "Unauthorized: User token is missing");
  }

  const comment = await deleteCommentService(commentId, commenterId);
  
  if (!comment) throw new ApiError(404, "Comment not found or unauthorized");
  return res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});