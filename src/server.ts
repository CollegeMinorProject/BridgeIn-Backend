import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import messageRouter from "./routes/message.routes";
import cors from "cors"; //CORS = Cross-Origin Resource Sharing.
/*This creates an Express application.
Think of app as the main brain of your backend.
All routes, middlewares, and settings will be attached to this app object.*/
import applicationRouter from "./routes/application.routes";

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
app.use("/auth", authRouter); //no prefix
app.use("/post", postRouter); //all routes starts with /post
app.use("/user", userRouter); //all routes starts with /user
app.use("/message", messageRouter); //all routes starts with /message
app.use("/api/applications", applicationRouter);
export default app; //We export the fully configured Express app so that index.ts can use it.
