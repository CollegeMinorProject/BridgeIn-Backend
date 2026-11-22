import { Router } from "express";
import { screenResumeController } from "../controllers/Resume/resumeScreening.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();

router.post("/screen", isLoggedInMiddleWare, screenResumeController);

export default router;