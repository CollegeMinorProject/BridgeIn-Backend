import { Router } from "express";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { createPost } from "../controllers/Post/post.controller";
import { upload } from "../middleware/multer.middleware";

// Your new controller imports
import { createJob, getJobs, updateJobStatus, deleteJob } from "../controllers/Post/job.controller";
import { addComment, getCommentsByPost, updateComment, deleteComment } from "../controllers/Post/comment.controller";

const router = Router();

// This protects all routes below it automatically
//router.use(isLoggedInMiddleWare);
// router.use(isLoggedInMiddleWare);
// router.use(isLoggedInMiddleWare);
router.use((req: any, res: any, next: any) => {
  req.user = { _id: "60d0fe4f5311236168a109ca" }; // Injects a fake valid MongoDB ID
  next();
});

// Friend's existing post route
router.post("/create", upload.single("photo"), createPost);

// Your new Comment routes (replacing the commented-out To-Dos)
router.post("/:postId/comments", addComment);
router.get("/:postId/comments", getCommentsByPost);
router.patch("/comments/:commentId", updateComment);
router.delete("/comments/:commentId", deleteComment);

// Your new Job routes
router.post("/jobs", createJob);
router.get("/jobs", getJobs);
router.patch("/jobs/:jobId", updateJobStatus);
router.delete("/jobs/:jobId", deleteJob);

export default router;