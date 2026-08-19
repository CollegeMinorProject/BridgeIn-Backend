import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authRouter);
app.use("/post", postRouter);

export default app;
