import { Router } from "express";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { createPost,likePost,unlikePost,getLikeDetails,} from "../controllers/Post/post.controller";
import { upload } from "../middleware/multer.middleware";


// Your new controller imports
import { createJob, getJobs, updateJobStatus, deleteJob } from "../controllers/Post/job.controller";
import { addComment, getCommentsByPost, updateComment, deleteComment } from "../controllers/Post/comment.controller";

const router = Router();

// Activate the REAL authentication middleware so it reads your Postman access token
router.use(isLoggedInMiddleWare);

// Friend's existing post route
router.post("/create", upload.single("photo"), createPost);

// Like and Unlike routes
router.post("/:postId/like", likePost);
router.delete("/:postId/like", unlikePost);

// Get like details
router.get("/:postId/likes", getLikeDetails);

// Your new Comment routes
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