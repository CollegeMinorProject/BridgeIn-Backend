import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import isEmailPresent from "../../dao/User/isEmailPresent";
import jwt from "jsonwebtoken";
import getEnv from "../../getEnv";
import { sendEmail } from "../../utils/Mail.util";
import { AuthenticatedRequest } from "../../@types/CustomExpressTypes";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.util";
import { tempUser } from "../../models/tempUser.model";
import saveUser from "../../dao/User/saveUser";
import { findAndDeleteTempUser } from "../../dao/TempUser/findAndDelete";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { IUser, User } from "../../models/user.model";
import getGoogleClient from "../../utils/getGoogleClient";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
//working
export const registerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Invalid data!", errors: result.error.flatten() });
    }
    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const exist = await isEmailPresent(normalizedEmail);
    if (exist) {
      throw new ApiError(409, "Email already in use");
    }
    await findAndDeleteTempUser(normalizedEmail);
    const newlyCreatedUser = await tempUser.create({
      name,
      email: normalizedEmail,
      password,
    });
    const verifyToken = jwt.sign(
      {
        _id: newlyCreatedUser.id,
      },
      getEnv.JWT_ACCESS_SECRET,
      {
        expiresIn: "1d",
      },
    );
    const verifyUrl = `${getEnv.APP_URL}/verifyEmail?token=${verifyToken}`;
    const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">Verify Your Email</h2>
      
      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
        Thank you for registering! Please verify your email address by clicking the button below. This helps us keep your account secure.
      </p>
      
      <div style="text-align: center;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
          Verify Email
        </a>
      </div>
      
      <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
        If the button above doesn't work, copy and paste this link into your web browser:<br><br>
        <a href="${verifyUrl}" style="color: #4F46E5; word-break: break-all; text-decoration: underline;">
          ${verifyUrl}
        </a>
      </p>
      
      <p style="color: #aaaaaa; font-size: 12px; margin-top: 20px; text-align: center;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  </div>
`;
    await sendEmail(newlyCreatedUser.email, "Verify your email", html);
    return res.status(201).json(new ApiResponse(201, {}, "User Registered"));
  },
);
//working
export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if (!token) {
      throw new ApiError(401, "Invalid Request");
    }
    let payload;
    try {
      payload = jwt.verify(token, getEnv.JWT_ACCESS_SECRET) as { _id: string };
    } catch (error) {
      throw new ApiError(401, "Invalid Request");
    }
    const temp = await tempUser.findById(payload._id);
    if (!temp) {
      return res.status(400).json({ message: "request expired" });
    }
    let input = {
      name: temp.name,
      email: temp.email,
      password: temp.password,
    };
    await saveUser(input);
    await findAndDeleteTempUser(temp.email);
    return res.status(201).json(new ApiResponse(201, "User Email Verified"));
  },
);
//checking
export const loginHandler = asyncHandler(
  async (req: Request, res: Response) => {
    console.log(req.body);
    const zvarification = loginSchema.safeParse(req.body);
    if (!zvarification.success) {
      throw new ApiError(400, "Invalid credential");
    }
    const { email, password } = zvarification.data;
    const normalizedEmail = email.toLowerCase().trim();
    const User: IUser | null = await isEmailPresent(normalizedEmail);
    if (!User) {
      throw new ApiError(404, "Invalid credential");
    }
    const isPasswordValid: Boolean = await User.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(404, "Invalid credential");
    }
    const accessToken = createAccessToken({ _id: User._id.toString() });
    const refreshToken = createRefreshToken({ _id: User._id.toString() });
    User.refreshToken = refreshToken;
    await User.save();
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
export const getNewAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      throw new ApiError(401, "Refresh token is missing");
    }
    const payload = verifyRefreshToken(token) as { _id: String };
    const user = await User.findById(payload._id);
    if (!user) {
      throw new ApiError(401, "Invalid credential");
    }
    const newAccessToken = createAccessToken(user.id);
    res.cookie(
      "accessToken",
      { accessToken: newAccessToken },
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 1000,
      },
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken: newAccessToken }, "logIn success"),
      );
  },
);
// export const logoutHandler=asyncHandler(async (req: AuthenticatedRequest, res: Response) =>{
//   const id = req.user;
//   const user = await User.findById(id);
//   if (!user) {
//     throw new ApiError(401, "Invalid Cradential");
//   }
//   user.refreshToken = "";
//   user.save();
//   res
//     .clearCookie("refreshToken", { path: "/" })
//     .clearCookie("accessToken", { path: "/" });
//   return res.status(200).json({
//     message: "Logged out",
//   });
// })
export async function GenerateResetPasswordlink(req: Request, res: Response) {
  const zvarification = loginSchema.safeParse(req.body);
  if (!zvarification.success) {
    throw new ApiError(400, "Invalid credential");
  }
  const { email, password } = zvarification.data;
  const normalizedEmail = email.toLowerCase().trim();
  const User: IUser | null = await isEmailPresent(normalizedEmail);
  const verifyToken = jwt.sign(
    {
      id: User?._id,
      email,
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
}
export async function ResetPassword(req: Request, res: Response) {
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
}

// export async function googleAuthStartHandler(req:Request,res:Response){
//   try {
//      const client=getGoogleClient();
//      const url=client.generateAuthUrl({
//       access_type:'offline',
//       prompt:'consent',
//       scope:['openid','email','profile']
//      });
//      return res.redirect(url);
//   } catch (error) {
//     console.log(error);
//   }
// }
// export async function googleAuthCallBackHandler(req:Request,res:Response){
//   const code=req.query.code as string |undefined;
//   if(!code){
//     return res.status(400).json({
//       message:"Missing code in callback"
//     })
//   }
//   const client=getGoogleClient();
//   const {tokens}=await client.getToken(code);
//   if(!tokens.id_token){
//     return res.status(400).json({
//       message:'No googles id_token is present'
//     })
//   }
//   const ticket=await client.verifyIdToken({
//      idToken:tokens.id_token,
//      audience:getEnv.GOOGLE_CLIENT_ID as string,
//   })
//   cost payload=ticket.getPayload();
//   const email=payload?.email;
//   const emailVerified=payload?.email_verified;
//   if(!email || !emailVerified){
//     return res.status(400).json({
//       message:'Google email account is not verified'
//     })
//   }
//   const normalizedEmail=email.toLowerCase().trim();
//   //if user present
//   let user
//   //if present just LogIn
// }
