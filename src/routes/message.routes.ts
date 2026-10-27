import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/Message/message.controller";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();

router.get("/:id", isLoggedInMiddleWare, getMessages);
router.post("/send/:id", isLoggedInMiddleWare, sendMessage);

export default router;