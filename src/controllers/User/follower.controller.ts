import { z } from "zod";
import { User } from "../../models/user.model";
import { Follower } from "../../models/follow.model";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { Types } from "mongoose";

// FIX 1: Changed `required_error` to `message` based on your Zod version
const followerBodySchema = z.object({
  targetUserId: z
    .string({ message: "targetUserId is required" })
    .regex(/^[a-f0-9]{24}$/i, "Invalid target user ID").transform(id => id.toLowerCase()),
});

export const followUser = asyncHandler(async (req: any, res: any) => {
  // 1. Grab the ID string directly from req.user
  const followerId = req.user;

  // 2. Safety Check: If no user ID is found
  if (!followerId) {
    throw new ApiError(401, "Unauthorized: User token is missing or invalid");
  }

  // FIX 2: Changed validation.error.errors to validation.error.issues
  const validation = followerBodySchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.issues[0].message);
  }
  const { targetUserId } = validation.data;

  if (followerId.toString() === targetUserId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const pair = { followed_by: followerId, main_id: targetUserId };
  if (!await User.exists({ _id: targetUserId })) throw new ApiError(404, "User not found");
  let follow;
  try {
    follow = await Follower.create(pair);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      throw new ApiError(409, "You are already following this user");
    }
    throw error;
  }


  return res
    .status(201)
    .json(new ApiResponse(201, follow, "User followed successfully"));
});

export const unfollowUser = asyncHandler(async (req: any, res: any) => {
  // 1. Grab the ID string directly from req.user based on your middleware
  const followerId = req.user;

  if (!followerId) {
    throw new ApiError(401, "Unauthorized: User token is missing or invalid");
  }

  // FIX 3: Changed validation.error.errors to validation.error.issues
  const validation = followerBodySchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.issues[0].message);
  }
  const { targetUserId } = validation.data;

  await Follower.findOneAndDelete({
    followed_by: followerId,
    main_id: targetUserId,
  });


  return res
    .status(200)
    .json(new ApiResponse(200, null, "User unfollowed successfully"));
});

function listConnections(mode: "followers" | "following") {
  return asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid profile ID");
    }

    const page = Math.max(1, Math.min(100_000, Number.parseInt(String(req.query.page), 10) || 1));
    const limit = Math.max(1, Math.min(50, Number.parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;
    const followers = mode === "followers";
    const filter = followers ? { main_id: userId } : { followed_by: userId };
    const [connections, total] = await Promise.all([
      Follower.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)
        .populate(followers ? "followed_by" : "main_id", "name avatar").lean(),
      Follower.countDocuments(filter),
    ]);

    res.json(new ApiResponse(200, {
      [mode]: connections,
      pagination: {
        page,
        limit,
        [followers ? "totalFollowers" : "totalFollowing"]: total,
        hasNextPage: skip + connections.length < total,
      },
    }));
  });
}

export const getFollowers = listConnections("followers");
export const getFollowing = listConnections("following");
