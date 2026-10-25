import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token.util";

export const isLoggedInMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Not authorised");
    return;
  }
  const accessToken = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(accessToken) as { _id: string };
    req.user = payload._id;
  } catch (error) {
    res.status(401).send("Not authorised");
    return;
  }
  next();
};
