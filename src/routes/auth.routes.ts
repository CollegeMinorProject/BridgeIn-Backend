import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  logoutHandler,
  googleAuthCallBackHandler,
  getNewAccessToken,
  ResetPassword,
  sendLogInWithOTPEmailHandler,
  verifyOTPHandler,
  Me,
  GenerateResetPasswordlinkHandler,
} from "../controllers/Auth/auth.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
const router = Router();
//attached to frontend
//register login verifyEmail getNewAccessToken logout me gooogle/callback
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/verifyEmail", verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
router.get("/logout", isLoggedInMiddleWare, logoutHandler);
router.post("/generateResetPasswordOTP", GenerateResetPasswordlinkHandler);
router.post("/resetPassword", ResetPassword);
router.post("/generateLogInOTP", sendLogInWithOTPEmailHandler);
router.post("/LogInWithOTP", verifyOTPHandler);
router.post("/google/callback", googleAuthCallBackHandler);
router.get("/me", isLoggedInMiddleWare, Me);
export default router;
