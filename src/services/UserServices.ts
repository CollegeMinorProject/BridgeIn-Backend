import mongoose, { QueryFilter, Types } from "mongoose";
import { User, IUser } from "../models/user.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { Post } from "../models/post.model";
import Like from "../models/like.model";
import { Comment } from "../models/comment.model";
import { Follower } from "../models/follow.model";
import { JobPost, IJobPost } from "../models/jobPost.model";
import { JobApplication } from "../models/jobApplication.model";
export const getProfileDataService = async (id: string) => {
  const [userStats] = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "channel",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "follower",
        as: "following",
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "owner",
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
              $in: [new mongoose.Types.ObjectId(id), "$followers.follower"],
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
export const getUserPostService = async (
  id: string,
  limit: number,
  page: number,
) => {
  const skip = (page - 1) * limit;
  const userId = new mongoose.Types.ObjectId(id);
  const [data, totalCount] = await Promise.all([
    Post.find({ belong_to: userId })
      .select("_id image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments({ belong_to: userId }),
  ]);

  return {
    posts: data,
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

  // 1. Users this person follows (main_id = followed user, followed_by = follower)
  const followingIds = (await Follower.find({ followed_by: userId }).distinct(
    "main_id",
  )) as Types.ObjectId[];
  // 2. Feed = followed users' posts + own posts
  const filter = { belong_to: { $in: [...followingIds, userId] } };
  // 3. Page of posts and the total count
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("belong_to", "name avatar headline")
      .lean(),
    Post.countDocuments(filter),
  ]);

  // 4. Batch the like/comment data for this page (no N+1 queries)
  const postIds = posts.map((p) => p._id);
  const [likeCounts, commentCounts, myLikes] = await Promise.all([
    Like.aggregate([
      { $match: { postid: { $in: postIds } } },
      { $group: { _id: "$postid", count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { postid: { $in: postIds } } },
      { $group: { _id: "$postid", count: { $sum: 1 } } },
    ]),
    Like.find({ post_id: { $in: postIds }, liked_by: userId })
      .select("postid")
      .lean(),
  ]);

  const likeMap = new Map(likeCounts.map((l) => [String(l._id), l.count]));
  const commentMap = new Map(
    commentCounts.map((c) => [String(c._id), c.count]),
  );
  const likedSet = new Set(myLikes.map((l) => String(l.postid)));
  // 5. Shape the response
  const feed = posts.map((post: any) => {
    const { belong_to, ...rest } = post;
    return {
      ...rest,
      author: belong_to,
      likesCount: likeMap.get(String(post._id)) ?? 0,
      commentsCount: commentMap.get(String(post._id)) ?? 0,
      isLikedByMe: likedSet.has(String(post._id)),
    };
  });
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
    employer_id: { $ne: userId },
  };

  const [jobs, total] = await Promise.all([
    JobPost.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("employer_id", "name avatar headline")
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
    const { employer_id, ...rest } = job;
    return {
      ...rest,
      employer: employer_id,
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

export const getUserSearchFeedService = async (
  search: string,
  limit: number,
  page: number,
) => {
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
  const safePage = Math.max(Math.floor(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const term = String(search ?? "")
    .trim()
    .slice(0, 50);

  if (term.length < 2) {
    return {
      users: [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  }

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter: QueryFilter<IUser> = {
    $or: [
      { name: new RegExp(escaped, "i") }, // "swap" finds "Swapneel Das"
      { email: new RegExp(`^${escaped}`, "i") }, // starts-with, can use the email index
    ],
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name avatar headline role") // email is searchable but never returned
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: skip + users.length < total,
    },
  };
};
