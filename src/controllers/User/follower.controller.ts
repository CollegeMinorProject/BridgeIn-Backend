import { Follower } from '../../models/follow.model';
import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { ApiError } from '../../utils/ErrorHandling.ts/APIError';
import { ApiResponse } from '../../utils/ErrorHandling.ts/APIResponse';
// 1. Import your Redis configuration (Adjust the path if your config folder is elsewhere)
import redisConfig from '../../config/redis.config'; 

export const followUser = asyncHandler(async (req: any, res: any) => {
  // 1. Grab the ID string directly from req.user based on your middleware
  const followerId = req.user;
  const { targetUserId } = req.params;

  // 2. Safety Check: If no user ID is found, stop safely instead of crashing
  if (!followerId) {
    throw new ApiError(401, "Unauthorized: User token is missing or invalid");
  }

  if (followerId.toString() === targetUserId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const existingFollow = await Follower.findOne({ follower: followerId, channel: targetUserId });
  if (existingFollow) {
    throw new ApiError(400, "You are already following this user");
  }

  const follow = await Follower.create({ follower: followerId, channel: targetUserId });
  
  // CACHE CLEARING: Delete the first page of cache so the UI shows the new follower instantly
  await redisConfig.del(`followers:${targetUserId}:page:1`);
  await redisConfig.del(`following:${followerId.toString()}:page:1`);

  return res.status(201).json(new ApiResponse(201, follow, "User followed successfully"));
});

export const unfollowUser = asyncHandler(async (req: any, res: any) => {
  // 1. Grab the ID string directly from req.user based on your middleware
  const followerId = req.user;
  const { targetUserId } = req.params;

  if (!followerId) {
    throw new ApiError(401, "Unauthorized: User token is missing or invalid");
  }

  await Follower.findOneAndDelete({ follower: followerId, channel: targetUserId });
  
  // CACHE CLEARING: Delete the old cache because the list just changed
  await redisConfig.del(`followers:${targetUserId}:page:1`);
  await redisConfig.del(`following:${followerId.toString()}:page:1`);

  return res.status(200).json(new ApiResponse(200, null, "User unfollowed successfully"));
});

export const getFollowers = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  
  // SCROLLING LOGIC (Pagination): Default to page 1, 20 followers per scroll
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // CACHE KEY GENERATION
  const cacheKey = `followers:${userId}:page:${page}`;

  // 1. Check Redis Memory First
  const cachedFollowers = await redisConfig.get(cacheKey);
  if (cachedFollowers) {
    // If it's in Redis, return it instantly! (Super fast)
    return res.status(200).json(new ApiResponse(200, JSON.parse(cachedFollowers), "Followers retrieved from cache"));
  }

  // 2. If not in Redis, query MongoDB with Skip and Limit
  const followers = await Follower.find({ channel: userId })
    .populate('follower', 'name email profilePic')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Show newest followers at the top

  // 3. Find out if there are more followers to load on the next scroll
  const totalFollowers = await Follower.countDocuments({ channel: userId });
  const hasNextPage = skip + followers.length < totalFollowers;

  const responseData = {
    followers,
    pagination: { page, limit, totalFollowers, hasNextPage }
  };

  // 4. Save to Redis Cache for 5 minutes (300 seconds) so the next request is instant
  await redisConfig.setex(cacheKey, 300, JSON.stringify(responseData));

  return res.status(200).json(new ApiResponse(200, responseData, "Followers retrieved from database"));
});

export const getFollowing = asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  
  // Same scrolling logic for the "Following" list
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const cacheKey = `following:${userId}:page:${page}`;

  const cachedFollowing = await redisConfig.get(cacheKey);
  if (cachedFollowing) {
    return res.status(200).json(new ApiResponse(200, JSON.parse(cachedFollowing), "Following retrieved from cache"));
  }

  const following = await Follower.find({ follower: userId })
    .populate('channel', 'name email profilePic')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalFollowing = await Follower.countDocuments({ follower: userId });
  const hasNextPage = skip + following.length < totalFollowing;

  const responseData = {
    following,
    pagination: { page, limit, totalFollowing, hasNextPage }
  };

  await redisConfig.setex(cacheKey, 300, JSON.stringify(responseData));

  return res.status(200).json(new ApiResponse(200, responseData, "Following retrieved from database"));
});