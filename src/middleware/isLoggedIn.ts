import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token.util";

export const isLoggedInMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let accessToken: string | null = req.cookies.accessToken;
  if (accessToken == null) {
    res.status(401).send("Not authorised");
    return;
  }
  try {
    let playLoad = verifyAccessToken(accessToken) as { _id: string };
    req.user = playLoad._id;
  } catch (error) {
    res.status(401).send("Not authorised");
    return;
  }
  next();
};
