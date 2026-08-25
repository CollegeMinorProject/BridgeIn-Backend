import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import getGoogleClient from "../../utils/getGoogleClient";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";

import {
  GenerateResetPasswordLinkService,
  getNewAccessTokenService,
  googleAuthCallBackService,
  logInService,
  logOutService,
  registerUser,
  ResetPasswordService,
  sendRegisterMail,
} from "../../services/AuthServices";
import {
  setAccessTokenInCookies,
  setRefreshTokenAndAccessTokenInCookies,
} from "../../utils/token.util";
//working
export const registerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(403, "Invalid data");
    }
    result.data.email = result.data.email.trim().toLowerCase();
    await sendRegisterMail(result.data);
    return res
      .status(201)
      .json(new ApiResponse(201, {}, "User Registered Email Send"));
  },
);
//working
export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if (!token) {
      throw new ApiError(401, "Invalid Request");
    }
    await registerUser(token);
    return res.status(201).json(new ApiResponse(201, "User Email Verified"));
  },
);
//working
export const loginHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const zvarification = loginSchema.safeParse(req.body);
    if (!zvarification.success) {
      throw new ApiError(400, "Invalid credential");
    }
    zvarification.data.email = zvarification.data.email.toLowerCase().trim();
    let { refreshToken, accessToken } = await logInService(zvarification.data);
    setRefreshTokenAndAccessTokenInCookies(res, refreshToken, accessToken);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken, refreshToken }, "logIn success"),
      );
  },
);
//working
export const getNewAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      throw new ApiError(401, "Refresh token is missing");
    }
    const newAccessToken = await getNewAccessTokenService(token);
    setAccessTokenInCookies(res, newAccessToken);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken: newAccessToken }, "logIn success"),
      );
  },
);
//working
export const logoutHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.user;
    await logOutService(res, id);
    return res.status(200).json({
      message: "Logged out",
    });
  },
);
//working
export const GenerateResetPasswordlink = asyncHandler(
  async (req: Request, res: Response) => {
    const zvarification = loginSchema.safeParse(req.body);
    if (!zvarification.success) {
      throw new ApiError(400, "Invalid credential");
    }
    const { email, password } = zvarification.data;
    const normalizedEmail = email.toLowerCase().trim();
    await GenerateResetPasswordLinkService(normalizedEmail, password);
    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Reset Password Link send"));
  },
);
//working
export const ResetPassword = async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    throw new ApiError(401, "Invalid Request");
  }
  await ResetPasswordService(token);
  return res.status(201).json(new ApiResponse(201, "Password Reset"));
};
//working
export const googleAuthStartHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const client = getGoogleClient();
      const url = client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "email", "profile"],
      });
      return res.redirect(url);
    } catch (error) {
      throw new ApiError(500, "Internal Server Error");
    }
  },
);
export const googleAuthCallBackHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    if (!code) {
      throw new ApiError(400, "Missing code in callback");
    }
    await googleAuthCallBackService(res, code);
    res.status(200).json(new ApiResponse(200, "Logged In"));
  },
);
