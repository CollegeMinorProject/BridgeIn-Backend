import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import cors from "cors";
import jobRoutes from './routes/job.routes';
import followerRoutes from './routes/follower.routes';

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);
app.use('/api/jobs', jobRoutes);
app.use('/api/connections', followerRoutes);
export default app;
