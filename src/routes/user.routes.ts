import { Router } from "express";
import multer from "multer";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
// We will apply this middleware to the test route below so TypeScript knows it is being used!
import { isLoggedInMiddleWare, readViewerIfAuthenticated } from "../middleware/isLoggedIn";
import { searchUsers } from "../controllers/search.controller";
import {
  getProfileData,
  getUserPosts,
  getUserFeed,
  updateOwnProfile,
} from "../controllers/User/user.controller";

const router = Router();
const parseAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, fields: 4, fieldSize: 8192 },
  fileFilter: (_req, file, callback) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return callback(null, true);
    callback(new Error("Choose a JPG, PNG, or WebP image."));
  },
}).single("avatar");

router.get("/profile/:id", readViewerIfAuthenticated, getProfileData);
router.get("/search", isLoggedInMiddleWare, searchUsers);
router.get("/post/:limit/:page", isLoggedInMiddleWare, getUserPosts);
router.get("/feed", isLoggedInMiddleWare, getUserFeed);
router.patch("/profile", isLoggedInMiddleWare, (req, res, next) => {
  parseAvatar(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
    const status = tooLarge ? 413 : 400;
    const message = tooLarge ? "Profile images must be 5 MB or smaller." : "Choose a JPG, PNG, or WebP image.";
    res.status(status).json(new ApiResponse(status, null, message));
  });
}, updateOwnProfile);
router.use(isLoggedInMiddleWare);
export default router;
