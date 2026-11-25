import { Follower } from "../../models/follow.model";

export const isfollowing = async (me: string, following: string) => {
  const exists = await Follower.exists({
    followed_by: me,
    main_id: following,
  });
  return Boolean(exists);
};
export const unfollow = async (me: string, following: string) => {
  const result = await Follower.findOneAndDelete({
    followed_by: me,
    main_id: following,
  });
  return Boolean(result);
};
export const follow = async (me: string, following: string) => {
  if (me === following) {
    throw new Error("You cannot follow yourself");
  }
  return await Follower.findOneAndUpdate(
    { followed_by: me, main_id: following },
    { followed_by: me, main_id: following },
    { upsert: true, new: true },
  );
};
