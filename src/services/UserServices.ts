import mongoose, { QueryFilter, Types } from "mongoose";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { Post } from "../models/post.model";
import Like from "../models/like.model";
import { Comment } from "../models/comment.model";
import { Follower } from "../models/follow.model";
import { JobPost, IJobPost } from "../models/jobPost.model";
import { JobApplication } from "../models/jobApplication.model";
export const getProfileDataService = async (id: string, viewerId?: string) => {
  const [userStats] = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "main_id",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "followed_by",
        as: "following",
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "belong_to",
        as: "posts",
      },
    },
    {
      $addFields: {
        followersCount: { $size: "$followers" },
        followingCount: { $size: "$following" },
        postsCount: { $size: "$posts" },
        isFollowing: {
          $cond: {
            if: {
              $in: [viewerId ? new mongoose.Types.ObjectId(viewerId) : null, "$followers.followed_by"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        refreshTokenHash: 0,
        followers: 0,
        following: 0,
        posts: 0,
      },
    },
  ]);
  if (!userStats) {
    throw new ApiError(400, "Invalid Request");
  }
  return userStats;
};
async function getPostStats(postIds: Types.ObjectId[], viewerId: Types.ObjectId) {
  const [likeCounts, commentCounts, myLikes] = await Promise.all([
    Like.aggregate([
      { $match: { post_id: { $in: postIds } } },
      { $group: { _id: "$post_id", count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { post_id: { $in: postIds } } },
      { $group: { _id: "$post_id", count: { $sum: 1 } } },
    ]),
    Like.find({ post_id: { $in: postIds }, liked_by: viewerId })
      .select("post_id")
      .lean(),
  ]);

  const likeMap = new Map(likeCounts.map((l) => [String(l._id), l.count]));
  const commentMap = new Map(
    commentCounts.map((c) => [String(c._id), c.count]),
  );
  const likedSet = new Set(myLikes.map((l) => String(l.post_id)));
  return (postId: Types.ObjectId) => ({
    likesCount: likeMap.get(String(postId)) ?? 0,
    commentsCount: commentMap.get(String(postId)) ?? 0,
    isLikedByMe: likedSet.has(String(postId)),
  });
}

export const getUserPostService = async (
  id: string,
  limit: number,
  page: number,
  viewerId: string,
) => {
  const skip = (page - 1) * limit;
  const userId = new Types.ObjectId(id);
  const [data, totalCount] = await Promise.all([
    Post.find({ belong_to: userId })
      .select("_id image text createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit).lean(),
    Post.countDocuments({ belong_to: userId }),
  ]);

  const stats = await getPostStats(data.map(post => post._id), new Types.ObjectId(viewerId));
  return {
    posts: data.map(post => ({ ...post, ...stats(post._id) })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};
export const getUserFeedService = async (
  id: string,
  limit: number,
  page: number,
) => {
  const userId = new Types.ObjectId(id);
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
  const safePage = Math.max(Math.floor(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const followingIds = (await Follower.find({ followed_by: userId }).distinct(
    "main_id",
  )) as Types.ObjectId[];
  const filter = { belong_to: { $in: followingIds, $ne: userId } };
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("belong_to", "name avatar headline")
      .lean(),
    Post.countDocuments(filter),
  ]);

  const stats = await getPostStats(posts.map(post => post._id), userId);
  const feed = posts.map(({ belong_to, ...post }) => ({
    ...post,
    author: belong_to,
    ...stats(post._id),
  }));
  return {
    posts: feed,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: skip + feed.length < total,
    },
  };
};
export const getJobFeedService = async (
  id: string,
  limit: number,
  page: number,
) => {
  const userId = new Types.ObjectId(id);
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
  const safePage = Math.max(Math.floor(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  // open jobs posted by other people
  const filter: QueryFilter<IJobPost> = {
    isOpen: true,
    posted_by: { $ne: userId },
  };

  const [jobs, total] = await Promise.all([
    JobPost.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("posted_by", "name avatar headline")
      .lean(),
    JobPost.countDocuments(filter),
  ]);
  // which jobs on this page has the user already applied to? (one query, no N+1)
  const applied = await JobApplication.find({
    candidate_id: userId,
    job_post_id: { $in: jobs.map((j) => j._id) },
  })
    .select("job_post_id")
    .lean();
  const appliedSet = new Set(applied.map((a) => String(a.job_post_id)));

  const feed = jobs.map((job: any) => {
    const { posted_by, ...rest } = job;
    return {
      ...rest,
      employer: posted_by,
      hasApplied: appliedSet.has(String(job._id)),
    };
  });
  return {
    jobs: feed,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: skip + feed.length < total,
    },
  };
};
