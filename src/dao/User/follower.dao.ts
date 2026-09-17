import { Follower } from "../../models/follow.model";

export const isfollowing = async (me: string, following: string) => {
  const exists = await Follower.exists({
    follower: me,
    channel: following,
  });
  return Boolean(exists);
};
export const unfollow = async (me: string, following: string) => {
  const result = await Follower.findOneAndDelete({
    follower: me,
    channel: following,
  });
  return Boolean(result);
};
export const follow = async (me: string, following: string) => {
  if (me === following) {
    throw new Error("You cannot follow yourself");
  }
  return await Follower.findOneAndUpdate(
    { follower: me, channel: following },
    { follower: me, channel: following },
    { upsert: true, new: true },
  );
};
