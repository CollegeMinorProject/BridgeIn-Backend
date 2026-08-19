import { Router } from "express";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { createPost } from "../controllers/Post/post.controller";
import { upload } from "../middleware/multer.middleware";
const router = Router();
router.use(isLoggedInMiddleWare);
router.post(
  "/create",
  isLoggedInMiddleWare,
  upload.single("photo"),
  createPost,
);

export default router;
