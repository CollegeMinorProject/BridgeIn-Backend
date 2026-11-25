import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import messageRouter from "./routes/message.routes";
import notificationRouter from "./routes/notification.routes";
import cors from "cors"; //CORS = Cross-Origin Resource Sharing.
/*This creates an Express application.
Think of app as the main brain of your backend.
All routes, middlewares, and settings will be attached to this app object.*/
import recruiterRequestRouter from "./routes/recruiterRequest.routes";
import applicationRouter from "./routes/application.routes";
import followerRouter from "./routes/follower.routes";
import resumeRoutes from "./routes/resume.routes";
import { productRateLimiter } from "./middleware/RateLimitter";



const app = express();
// Keep forwarded IPs untrusted unless the deployment explicitly configures
// its proxy addresses or a fixed number of proxy hops.
const trustedProxy = process.env.TRUST_PROXY?.trim();
if (trustedProxy) {
  app.set("trust proxy", /^\d+$/.test(trustedProxy) ? Number(trustedProxy) : trustedProxy);
}
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);
app.use(productRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authRouter); //no prefix
app.use("/post", postRouter); //all routes starts with /post
app.use("/user", userRouter); //all routes starts with /user
app.use("/follower", followerRouter);
app.use("/message", messageRouter); //all routes starts with /message
app.use("/notifications", notificationRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/recruiter-requests", recruiterRequestRouter);
// Add this with your other app.use(...) lines:
app.use("/api/v1/resume", resumeRoutes);
export default app; //We export the fully configured Express app so that index.ts can use it.

