import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/Message/message.controller"; 
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn"; 

const router = Router();

router.use(isLoggedInMiddleWare);

// GET route still needs the ID in the URL to know whose chat history to fetch
router.get("/:id", getMessages);

// POST route no longer needs :id in the URL
router.post("/send", sendMessage);

export default router;