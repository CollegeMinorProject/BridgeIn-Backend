import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import {
  followUnfollowService,
  getFollowerService,
  getFollowingService,
} from "../../services/UserServices";
import { httpStatusCodes } from "../../utils/APIResponse";
export const followUnfollow = asyncHandler(
  async (req: Request, res: Response) => {
    const followingId = req.body.id;
    if (!followingId) {
      throw new ApiError(400, "Target user ID is required");
    }
    const result: number = await followUnfollowService(req.user, followingId);
    const isFollowing = result === 1;
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isFollowing },
          isFollowing
            ? "User followed successfully"
            : "User unfollowed successfully",
        ),
      );
  },
);
export const getFollower = asyncHandler(async (req: Request, res: Response) => {
  let id = req.params?.id;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  if (!id) {
    res.status(400).json(new ApiResponse(400, httpStatusCodes[400]));
    return;
  }
  let response = await getFollowerService(id, page);
  res.status(200).json(new ApiResponse(200, response));
});
export const getFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    let id = req.params?.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    if (!id) {
      res.status(400).json(new ApiResponse(400, httpStatusCodes[400]));
      return;
    }
    let response = await getFollowingService(id, page);
    res.status(200).json(new ApiResponse(200, response));
  },
);
