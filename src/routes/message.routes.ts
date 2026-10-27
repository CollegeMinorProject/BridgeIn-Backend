import { Router } from "express";
import { sendMessage } from "../controllers/Message/message.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();

router.post("/send/:id", isLoggedInMiddleWare, sendMessage);

export default router;