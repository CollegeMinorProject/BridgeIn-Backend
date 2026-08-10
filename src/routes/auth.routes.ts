import { Router } from "express";
import {
  registerHandler,
  verifyEmailHandler,
} from "../controllers/Auth/auth.controller";
const router = Router();
router.post("/register", registerHandler);
// router.post("/login", loginHandler);
router.get("/verifyEmail", verifyEmailHandler);
export default router;
