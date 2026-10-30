import { Router } from "express";
import { 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing 
} from "../controllers/User/follower.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn"; // Ensure the path matches your project structure

const router = Router();

// This line applies the middleware to ALL routes below it, fixing the crash!
router.use(isLoggedInMiddleWare);

// The parameter :targetUserId MUST match what we used in the controller code
router.post("/follow/:targetUserId", followUser);
router.post("/unfollow/:targetUserId", unfollowUser);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;