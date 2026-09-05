import isEmailPresent from "../dao/User/isEmailPresent";
import getEnv from "../getEnv";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/Mail.util";
import saveUser from "../dao/User/saveUser";
import { IUser, User } from "../models/user.model";
import crypto from "node:crypto";
import { redisConfig } from "../index";
import { RedisEmailOTPKey } from "../utils/redisKeys";
import {
  createAccessToken,
  createRefreshToken,
  setRefreshTokenAndAccessTokenInCookies,
  verifyRefreshToken,
} from "../utils/token.util";
import { Response } from "express";
import getGoogleClient from "../utils/getGoogleClient";
import { OTPMAIL, RESETURLMAIL, VERIFYURL } from "../utils/MailHTMLConstants";
type registerObject = {
  email: string;
  name: string;
  password: string;
};
type loginObject = {
  email: string;
  password: string;
};
export const sendRegisterMail = async ({
  email,
  name,
  password,
}: registerObject) => {
  const normalizedEmail = email.toLowerCase().trim();
  const exist = await isEmailPresent(normalizedEmail);
  if (exist) {
    throw new ApiError(409, "Email already in use");
  }
  const verifyToken = jwt.sign(
    {
      name,
      email,
      password,
    },
    getEnv.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    },
  );
  const verifyUrl = `${getEnv.APP_URL}/verifyEmail?token=${verifyToken}`;
  const html = VERIFYURL(verifyUrl);
  await sendEmail(email, "Verify your email", html);
};
export const registerUser = async (token: string) => {
  let payload;
  try {
    payload = jwt.verify(token, getEnv.JWT_ACCESS_SECRET) as {
      email: string;
      name: string;
      password: string;
    };
  } catch (error) {
    throw new ApiError(401, "Invalid Request");
  }
  const isPresent = await isEmailPresent(payload.email);
  if (isPresent != null) {
    throw new ApiError(401, "Request expired");
  }
  let input = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
  };
  await saveUser(input);
};
export const logInService = async ({ email, password }: loginObject) => {
  const User: IUser | null = await isEmailPresent(email);
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
  return { accessToken, refreshToken };
};
export const logOutService = async (
  res: Response,
  id: string,
): Promise<void> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(401, "Invalid Cradential");
  }
  user.refreshToken = "";
  await user.save();
  res
    .clearCookie("refreshToken", { path: "/" })
    .clearCookie("accessToken", { path: "/" });
};
export const getNewAccessTokenService = async (token: string) => {
  const payload = verifyRefreshToken(token) as { _id: String };
  console.log(JSON.stringify(payload));
  const user = await User.findById(payload._id);
  if (!user || user.refreshToken != token) {
    throw new ApiError(401, "Invalid credential");
  }
  return createAccessToken({ _id: user.id });
};
export const GenerateResetPasswordLinkService = async (
  email: string,
  password: string,
): Promise<void> => {
  const User: IUser | null = await isEmailPresent(email);
  if (User == null) {
    throw new ApiError(404, "Invalid Request");
  }
  const verifyToken = jwt.sign(
    {
      id: User?._id,
      email: email,
      password,
    },
    getEnv.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    },
  );
  const resetUrl = `${getEnv.APP_URL}/resetPassword?token=${verifyToken}`;
  const html = RESETURLMAIL(resetUrl);
  await sendEmail(email, "Verify your email", html);
};
export const setLogInOTP = async (email: string) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  await redisConfig.set(RedisEmailOTPKey(email), otp, "EX", 5 * 60);
  const html = OTPMAIL(otp, 5);
  await sendEmail(email, "Verify your email", html);
};
export const validateLogInOTP = async (email: string, otp: string) => {
  const saveotp = await redisConfig.get(RedisEmailOTPKey(email));
  if (!saveotp || saveotp != otp) {
    throw new ApiError(400, "INVALID OTP");
  }
  const User: IUser | null = await isEmailPresent(email);
  if (!User) {
    throw new ApiError(402, "Not Registered");
  }
  const accessToken = createAccessToken({ _id: User._id.toString() });
  const refreshToken = createRefreshToken({ _id: User._id.toString() });
  redisConfig.del(RedisEmailOTPKey(email));
  User.refreshToken = refreshToken;
  await User.save();
  return { accessToken, refreshToken };
};
export const ResetPasswordService = async (token: string): Promise<void> => {
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
    throw new ApiError(400, "Request Expired");
  }
  user.password = payload.password;
  await user.save();
};
export const googleAuthCallBackService = async (
  res: Response,
  code: string,
): Promise<void> => {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new ApiError(500, "No google id_token is present");
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: getEnv.GOOGLE_CLIENT_ID as string,
  });
  const payload = ticket.getPayload();
  const name = payload?.name;
  const email = payload?.email;
  const emailVerified = payload?.email_verified;
  if (!email || !emailVerified || !name) {
    throw new ApiError(400, "Google email account is not verified");
  }
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString("hex");
    let input = {
      name: name,
      email: email,
      password: randomPassword,
    };
    user = await saveUser(input);
  }
  let accessToken = createAccessToken({ _id: user.id });
  let refreshToken = createRefreshToken({ _id: user.id });
  setRefreshTokenAndAccessTokenInCookies(res, refreshToken, accessToken);
};
