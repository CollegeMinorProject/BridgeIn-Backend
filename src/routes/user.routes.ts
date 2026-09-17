import { Router } from "express";
import { followUnfollow } from "../controllers/User/user.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();
router.post("/followUnfollow", isLoggedInMiddleWare, followUnfollow);
export default router;
