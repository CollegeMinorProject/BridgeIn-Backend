import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import messageRouter from "./routes/message.routes";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);
app.use("/message", messageRouter);
export default app;
