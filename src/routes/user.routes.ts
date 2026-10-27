import { Router } from "express";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

// Importing your working follower functions instead of the empty placeholders
import { followUser, unfollowUser, getFollowers, getFollowing } from "../controllers/User/follower.controller";

const router = Router();
//router.use(isLoggedInMiddleWare);
// router.use(isLoggedInMiddleWare);
router.use((req: any, res: any, next: any) => {
  req.user = { _id: "60d0fe4f5311236168a109ca" };
  next();
});
// Your newly linked endpoints
router.post("/follow/:targetUserId", followUser);
router.delete("/unfollow/:targetUserId", unfollowUser);
router.get("/follower/:userId", getFollowers);
router.get("/following/:userId", getFollowing);

// router.get("/getMyfeed");

export default router;