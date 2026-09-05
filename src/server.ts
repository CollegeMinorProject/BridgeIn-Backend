import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default dev port
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // only needed if you're sending cookies/auth headers
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authRouter);
app.use("/post", postRouter);

export default app;
