import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { followUnfollowService } from "../../services/UserServices";
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
