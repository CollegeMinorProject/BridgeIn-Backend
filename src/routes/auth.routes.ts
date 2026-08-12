import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  googleAuthStartHandler,
  googleAuthCallBackHandler,
  getNewAccessToken,
} from "../controllers/Auth/auth.controller";
const router = Router();
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/verifyEmail", verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
// router.get("/logout", logoutHandler);
// router.get("/google", googleAuthStartHandler);
// router.get("/google/callback", googleAuthCallBackHandler);
export default router;
