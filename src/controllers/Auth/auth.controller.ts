import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import isEmailPresent from "../../dao/User/isEmailPresent";
import jwt from "jsonwebtoken";
import getEnv from "../../getEnv";
import { sendEmail } from "../../utils/Mail.util";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.util";
import { tempUser } from "../../models/tempUser.model";
import saveUser from "../../dao/User/saveUser";
import { findAndDeleteTempUser } from "../../dao/TempUser/findAndDelete";
//working
export async function registerHandler(req: Request, res: Response) {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Invalid data!", errors: result.error.flatten() });
    }
    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const exist: boolean = await isEmailPresent(normalizedEmail);
    if (exist) {
      return res.status(409).json({
        message: "Email is already in use",
      });
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
    return res.status(201).json({
      message: "User registered",
      user: {
        id: newlyCreatedUser.id,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
}
//working
export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const token = req.query.token as string | undefined;
    if (!token) {
      return res.status(400).json({ message: "Verification token is missing" });
    }
    console.log("Complete Token:", token);
    let payload;
    try {
      payload = jwt.verify(token, getEnv.JWT_ACCESS_SECRET) as { _id: string };
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Token is invalid or has expired" });
    }
    console.log(payload);
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
    return res.status(201).json({
      message: "User registered",
    });
  } catch (error) {
    console.log("Error:-", error);
    return res.status(500).json({
      message: "server Error",
    });
  }
}
//checking
export async function loginHandler(req: Request, res: Response) {
  const zvarification = loginSchema.safeParse(req.body);
  if (!zvarification.success) {
    return res.status(400).json({
      message: "Invalid data!",
      errors: zvarification.error.flatten(),
    });
  }
  const { email, password } = zvarification.data;
  const normalizedEmail = email.toLowerCase().trim();
  //check credenials

  const accessToken = createAccessToken(User.id);
  const refreshToken = createRefreshToken(User.id);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    message: "login",
  });
}
// export async function refreshHandler(req: Request, res: Response) {
//   const token = req.cookies?.refreshToken as string | undefined;
//   if (!token) {
//     return res.status(401).json({
//       message: "Refresh token missing",
//     });
//   }
//   const payload = verifyRefreshToken(token);
//   const user = await User.findById(payload.id);
//   if (!user) {
//     return res.status(401).json({ message: "user not found" });
//   }
//   const newAccesstoken = createAccessToken(user.id);
//   const newRefreshToken = createRefreshToken(user.id);
// }
// export async function logoutHandler(req: Request, res: Response) {
//   res.clearCookie("refreshToken", { path: "/" });
//   return res.status(200).json({
//     message: "Logged out",
//   });
// }
