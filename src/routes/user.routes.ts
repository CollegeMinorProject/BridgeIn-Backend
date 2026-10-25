import { Router } from "express";
import {
  followUnfollow,
  getFollower,
  getFollowing,
} from "../controllers/User/user.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();
router.use(isLoggedInMiddleWare);
router.post("/followUnfollow", followUnfollow);
router.get("/follower/:id", getFollower);
router.get("/following/:id", getFollowing);
export default router;

// router.get("/getMyfeed");
