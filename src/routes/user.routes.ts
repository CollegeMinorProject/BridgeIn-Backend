import { Router } from "express";
// We will apply this middleware to the test route below so TypeScript knows it is being used!
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import {
  getProfileData,
  getUserPosts,
} from "../controllers/User/user.controller";

const router = Router();

router.get("/profile/:id", getProfileData);
router.get("/post/:limit/:page", getUserPosts);
router.use(isLoggedInMiddleWare);
export default router;
