import { Router } from "express";
import {
  cancelApplication, listMyApplications, listRecruiterApplications, scheduleInterview,
  submitApplication, submittedResume, updateApplicationStatus,
} from "../controllers/Post/application.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();
router.use(isLoggedInMiddleWare);
router.get("/mine", listMyApplications);
router.get("/recruiter", listRecruiterApplications);
router.post("/", submitApplication);
router.get("/:applicationId/resume", submittedResume);
router.patch("/:applicationId/status", updateApplicationStatus);
router.post("/:applicationId/interview", scheduleInterview);
router.patch("/:applicationId/cancel", cancelApplication);
export default router;
