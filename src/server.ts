import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authRouter);

app.post("/working", (_req, res) => {
  console.log(_req.body);
  res.json({ status: "ok" });
});

export default app;
