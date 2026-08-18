import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
  loginHandler,
  logoutHandler,
  googleAuthStartHandler,
  googleAuthCallBackHandler,
  getNewAccessToken,
} from "../controllers/Auth/auth.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
const router = Router();
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/verifyEmail", verifyEmailHandler);
router.post("/getNewAccessToken", getNewAccessToken);
router.get("/logout", isLoggedInMiddleWare, logoutHandler);
router.get("/google", googleAuthStartHandler);
router.get("/google/callback", googleAuthCallBackHandler);
export default router;
