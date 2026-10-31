import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  logoutHandler,
  googleAuthCallBackHandler,
  getNewAccessToken,
  GenerateResetPasswordlink,
  ResetPassword,
  sendLogInWithOTPEmailHandler,
  verifyOTPHandler,
} from "../controllers/Auth/auth.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
const router = Router();
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/verifyEmail", verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
router.get("/logout", isLoggedInMiddleWare, logoutHandler);
router.post("/generateresetpasswordlink", GenerateResetPasswordlink);
router.get("/resetpassword", ResetPassword);
router.post("/google/callback", googleAuthCallBackHandler);
router.post("/set-OTP", sendLogInWithOTPEmailHandler);
router.post("/verifyOTP", verifyOTPHandler);
router.post("/logout", logoutHandler);
export default router;
