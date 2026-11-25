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
import {
  authRateLimiter,
  credentialRateLimiter,
  emailCodeRateLimiter,
} from "../middleware/RateLimitter";

const router = Router();
router.use(authRateLimiter);
//attached to frontend
//register login verifyEmail getNewAccessToken logout me gooogle/callback
router.post("/register", emailCodeRateLimiter, registerHandler);
router.post("/login", credentialRateLimiter, loginHandler);
router.post("/verifyEmail", credentialRateLimiter, verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
router.get("/logout", isLoggedInMiddleWare, logoutHandler);
router.post("/generateResetPasswordOTP", emailCodeRateLimiter, GenerateResetPasswordlinkHandler);
router.post("/resetPassword", credentialRateLimiter, ResetPassword);
router.post("/generateLogInOTP", emailCodeRateLimiter, sendLogInWithOTPEmailHandler);
router.post("/LogInWithOTP", credentialRateLimiter, verifyOTPHandler);
router.post("/google/callback", credentialRateLimiter, googleAuthCallBackHandler);
router.get("/me", isLoggedInMiddleWare, Me);
export default router;
