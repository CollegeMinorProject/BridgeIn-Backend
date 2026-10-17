import { follow, isfollowing, unfollow } from "../dao/User/follower.dao";
import { UserHasThisId } from "../dao/User/Users";
import { Follower } from "../models/follow.model";
import { httpStatusCodes } from "../utils/APIResponse";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
export const followUnfollowService = async (
  me: string,
  following: string,
): Promise<number> => {
  let isPresent = await UserHasThisId(following);
  if (!isPresent) {
    throw new ApiError(400, httpStatusCodes[400]);
  }
  let isFollowing = await isfollowing(me, following);
  if (isFollowing) {
    await unfollow(me, following);
    return 0;
  } else {
    await follow(me, following);
    return 1;
  }
};
export const getFollowerService = async (id: string, page: number) => {
  const limit = 25;
  const skip = (Math.max(1, page) - 1) * limit;
  const [followers, totalCount] = await Promise.all([
    Follower.find({ channel: id })
      .sort({ createdAt: -1 }) // Newest followers first
      .skip(skip)
      .limit(limit)
      .populate({
        path: "follower",
        select: "name avatar",
      })
      .lean(),
    Follower.countDocuments({ channel: id }),
  ]);
  const users = followers.map((f) => f.follower);
  return {
    followers: users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalFollowers: totalCount,
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  };
};
export const getFollowingService = async (id: string, page: number) => {
  const limit = 25;
  const skip = (Math.max(1, page) - 1) * limit;
  const [followers, totalCount] = await Promise.all([
    Follower.find({ follower: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "follower",
        select: "name avatar",
      })
      .lean(),
    Follower.countDocuments({ follower: id }),
  ]);
  const users = followers.map((f) => f.follower);
  return {
    following: users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalFollowers: totalCount,
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  };
};
