import { Follower } from '../../models/follow.model';
import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { APIError } from '../../utils/ErrorHandling.ts/APIError';
import { APIResponse } from '../../utils/ErrorHandling.ts/APIResponse';

export const followUser = asyncHandler(async (req: any, res: any) => {
  const followerId = req.user?._id;
  const { targetUserId } = req.params;

  if (followerId.toString() === targetUserId) {
    throw new APIError(400, "You cannot follow yourself");
  }

  const existingFollow = await Follower.findOne({ follower: followerId, channel: targetUserId });
  if (existingFollow) {
    throw new APIError(400, "You are already following this user");
  }

  const follow = await Follower.create({ follower: followerId, channel: targetUserId });
  return res.status(201).json(new APIResponse(201, follow, "User followed successfully"));
});

export const unfollowUser = asyncHandler(async (req: any, res: any) => {
  const followerId = req.user?._id;
  const { targetUserId } = req.params;

  await Follower.findOneAndDelete({ follower: followerId, channel: targetUserId });
  return res.status(200).json(new APIResponse(200, null, "User unfollowed successfully"));
});

export const getFollowers = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  const followers = await Follower.find({ channel: userId }).populate('follower', 'name email profilePic');
  return res.status(200).json(new APIResponse(200, followers, "Followers retrieved"));
});

export const getFollowing = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  const following = await Follower.find({ follower: userId }).populate('channel', 'name email profilePic');
  return res.status(200).json(new APIResponse(200, following, "Following retrieved"));
});