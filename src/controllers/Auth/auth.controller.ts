import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import isEmailPresent from "../../dao/User/isEmailPresent";
import jwt from "jsonwebtoken";
import getEnv from "../../getEnv";
import { sendEmail } from "../../utils/Mail.util";
import { AuthenticatedRequest } from "../../@types/CustomExpressTypes";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { IUser, User } from "../../models/user.model";
import getGoogleClient from "../../utils/getGoogleClient";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import crypto from "node:crypto";
import {
  getNewAccessTokenService,
  logInService,
  registerUser,
  sendRegisterMail,
} from "../../services/AuthServices";
import saveUser from "../../dao/User/saveUser";
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
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 1000,
      });
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
    console.log(newAccessToken);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken: newAccessToken }, "logIn success"),
      );
  },
);
//working
export const logoutHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.user;
    console.log(id);
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(401, "Invalid Cradential");
    }
    user.refreshToken = "";
    user.save();
    res
      .clearCookie("refreshToken", { path: "/" })
      .clearCookie("accessToken", { path: "/" });
    return res.status(200).json({
      message: "Logged out",
    });
  },
);
//working
export const GenerateResetPasswordlink = async (
  req: Request,
  res: Response,
) => {
  const zvarification = loginSchema.safeParse(req.body);
  if (!zvarification.success) {
    throw new ApiError(400, "Invalid credential");
  }
  const { email, password } = zvarification.data;
  const normalizedEmail = email.toLowerCase().trim();
  const User: IUser | null = await isEmailPresent(normalizedEmail);
  if (User == null) {
    throw new ApiError(404, "Invalid Request");
  }
  const verifyToken = jwt.sign(
    {
      id: User?._id,
      email: normalizedEmail,
      password,
    },
    getEnv.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    },
  );
  const resetUrl = `${getEnv.APP_URL}/resetPassword?token=${verifyToken}`;
  const html = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">Reset Your Password</h2>
      
      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
        We received a request to reset your password. Click the button below to choose a new password. This link will expire shortly for your security.
      </p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
        If the button above doesn't work, copy and paste this link into your web browser:<br><br>
        <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all; text-decoration: underline;">
          ${resetUrl}
        </a>
      </p>
      
      <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  </div>
`;
  await sendEmail(email, "Verify your email", html);
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Reset Password Link send"));
};
//working
export const ResetPassword = async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    throw new ApiError(401, "Invalid Request");
  }
  let payload;
  try {
    payload = jwt.verify(token, getEnv.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      password: string;
    };
  } catch (error) {
    throw new ApiError(401, "Invalid Request");
  }
  const user = await User.findById(payload.id);
  if (!user) {
    return res.status(400).json({ message: "request expired" });
  }
  user.password = payload.password;
  await user.save();
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
    console.log(code);
    if (!code) {
      throw new ApiError(400, "Missing code in callback");
    }
    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.status(400).json({
        message: "No google id_token is present",
      });
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: getEnv.GOOGLE_CLIENT_ID as string,
    });
    const payload = ticket.getPayload();
    console.log(JSON.stringify(payload));
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    if (!email || !emailVerified) {
      throw new ApiError(400, "Google email account is not verified");
    }
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      let input = {
        name: payload.name,
        email: payload.email,
        password: randomPassword,
      };
      await saveUser(input);
    }
    return res.status(400).json({
      message: "Google email account is not verified",
    });
  },
);
