import { follow, isfollowing, unfollow } from "../dao/User/follower.dao";
import { UserHasThisId } from "../dao/User/Users";
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
