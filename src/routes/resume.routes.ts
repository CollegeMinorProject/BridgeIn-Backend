import { Router } from "express";
import multer from "multer";
import { addResume, listResumes, MAX_RESUME_BYTES, removeResume, renameResume } from "../controllers/Resume/resume.controller";
import { screenResumeController } from "../controllers/Resume/resumeScreening.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";

const router = Router();
router.use(isLoggedInMiddleWare);
const parseResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES + 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname)) return callback(null, true);
    callback(new Error("Choose a PDF resume."));
  },
}).single("resume");

router.get("/", listResumes);
router.patch("/:id", renameResume);
router.delete("/:id", removeResume);
router.post("/", (req, res, next) => {
  parseResume(req, res, (error) => {
    if (!error) return next();
    const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = status === 413 ? "The resume must be 1 MB or smaller." : "Choose one PDF resume.";
    res.status(status).json(new ApiResponse(status, null, message));
  });
}, addResume);

router.post("/screen", screenResumeController);

export default router;
