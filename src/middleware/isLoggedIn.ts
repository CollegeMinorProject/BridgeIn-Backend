import { NextFunction, Response } from "express";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { AuthenticatedRequest } from "../@types/CustomExpressTypes";
import { verifyAccessToken } from "../utils/token.util";

export const isLoggedInMiddleWare = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  let accessToken: string | null = req.cookies.refreshToken;
  if (!accessToken) {
    throw new ApiError(404, "Not authorised");
  }
  let playLoad = verifyAccessToken(accessToken) as { id: string };
  console.log(JSON.stringify(accessToken, null, 2));
  req.user = playLoad.id;
  next();
};
