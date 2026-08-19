import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  logoutHandler,
  googleAuthStartHandler,
  googleAuthCallBackHandler,
  getNewAccessToken,
  GenerateResetPasswordlink,
  ResetPassword,
} from "../controllers/Auth/auth.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
const router = Router();
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/verifyEmail", verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
router.get("/logout", isLoggedInMiddleWare, logoutHandler);
router.post("/generateresetpasswordlink", GenerateResetPasswordlink);
router.get("/resetpassword", ResetPassword);
router.get("/google", googleAuthStartHandler);
router.get("/google/callback", googleAuthCallBackHandler);
export default router;
