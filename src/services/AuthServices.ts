import isEmailPresent from "../dao/User/isEmailPresent";
import getEnv from "../getEnv";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import saveUser from "../dao/User/saveUser";
import { IUser, User } from "../models/user.model";
import crypto from "node:crypto";
import { isSeededDemoAccount } from "../utils/demoSeedId";
import redisConfig from "../config/redis.config";
import {
  RedisEmailOTPKey,
  RedisEmailVerificationKey,
} from "../utils/redisKeys";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  setRefreshTokenAndAccessTokenInCookies,
  verifyRefreshToken,
} from "../utils/token.util";
import { Response } from "express";
import getGoogleClient from "../utils/getGoogleClient";
import { OTPMAIL } from "../utils/MailHTMLConstants";
import mongoose from "mongoose";
import { otpEmailEnqueue } from "../queues/producer/producer";
import { OTP_LIFETIME_MS } from "../queues/queuePolicy";
import conversationModel from "../models/conversation.model";
import { Notification } from "../models/notification.model";
import messageModel from "../models/message.model";
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
  let Token = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + OTP_LIFETIME_MS;
  const html = OTPMAIL(Token, OTP_LIFETIME_MS / 60_000);
  let key = RedisEmailVerificationKey(email, Token);
  const stored = await redisConfig.multi()
    .hset(key, { email, name, password })
    .pexpireat(key, expiresAt)
    .exec();
  if (!stored || stored.some(([error]) => error)) {
    throw new ApiError(503, "Could not store the verification code");
  }
  await otpEmailEnqueue(email, "Email Verification OTP", html, expiresAt);
};
export const registerUser = async (email: string, otp: string) => {
  let key = RedisEmailVerificationKey(email, otp);
  let payload = await redisConfig.hgetall(key);
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(401, "Invalid Request");
  }
  const isPresent = await isEmailPresent(payload.email);
  if (isPresent != null) {
    throw new ApiError(401, "Request expired");
  }
  const newUserId = new mongoose.Types.ObjectId();

  const refreshToken = createRefreshToken({ _id: newUserId.toString() });
  let input = {
    _id: newUserId,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    refreshTokenHash: hashRefreshToken(refreshToken),
  };
  let saved = await saveUser(input);
  const accessToken = createAccessToken({
    _id: newUserId.toString(),
    role: saved.role,
  });
  return { accessToken, refreshToken };
};
export const logInService = async ({ email, password }: loginObject) => {
  const User: IUser | null = await isEmailPresent(email);
  if (!User || (password === "1" && !isSeededDemoAccount(User.email, User._id))) {
    throw new ApiError(404, "Invalid credential");
  }
  const isPasswordValid: Boolean = await User.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid credential");
  }
  const accessToken = createAccessToken({
    _id: User._id.toString(),
    role: User.role,
  });
  const refreshToken = createRefreshToken({ _id: User._id.toString() });
  User.refreshTokenHash = hashRefreshToken(refreshToken);
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
  user.refreshTokenHash = "";
  await user.save();
  res
    .clearCookie("refreshToken", { path: "/" })
    .clearCookie("accessToken", { path: "/" });
};
export const getNewAccessTokenService = async (token: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (typeof payload !== "object" || typeof payload._id !== "string") {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await User.findOne({ _id: payload._id, refreshTokenHash: hashRefreshToken(token) });
  if (!user) {
    throw new ApiError(401, "Invalid credential");
  }
  return createAccessToken({ _id: user.id, role: user.role });
};
export const GenerateResetPasswordLinkService = async (
  email: string,
): Promise<void> => {
  const User: IUser | null = await isEmailPresent(email);
  if (User == null) {
    throw new ApiError(404, "Invalid Request");
  }
  await setLogInOTP(email);
};
export const setLogInOTP = async (email: string) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + OTP_LIFETIME_MS;
  await redisConfig.set(RedisEmailOTPKey(email), otp, "PXAT", expiresAt);
  const html = OTPMAIL(otp, OTP_LIFETIME_MS / 60_000);
  await otpEmailEnqueue(email, "Verify your email", html, expiresAt);
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
  User.refreshTokenHash = hashRefreshToken(refreshToken);
  await User.save();
  return { accessToken, refreshToken };
};
export const ResetPasswordService = async (
  email: string,
  password: string,
  otp: string,
): Promise<void> => {
  const saveotp = await redisConfig.get(RedisEmailOTPKey(email));
  if (!saveotp || saveotp != otp) {
    throw new ApiError(400, "INVALID Request");
  }
  const user = await isEmailPresent(email);
  if (!user) {
    throw new ApiError(400, "INVALID Request");
  }
  user.password = password;
  await user.save();
};
export const googleAuthCallBackService = async (
  res: Response,
  code: string,
): Promise<string> => {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new ApiError(500, "Internal Server Error");
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
      email: normalizedEmail,
      password: randomPassword,
    };
    user = await saveUser(input);
  }
  const accessToken = createAccessToken({ _id: user.id, role: user.role });
  const refreshToken = createRefreshToken({ _id: user.id });
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();
  setRefreshTokenAndAccessTokenInCookies(res, refreshToken, accessToken);
  return accessToken;
};
export const getMe = async (id: string) => {
  const user = await User.findById(id).select("-password -refreshToken -refreshTokenHash").lean();
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }
  const userId = user._id;

  const [
    unreadNotificationsCount,
    unreadJobNotificationsCount,
    conversationIds,
  ] = await Promise.all([
    Notification.countDocuments({ recipient_id: userId, isRead: false }),
    Notification.countDocuments({
      recipient_id: userId,
      isRead: false,
      type: "job_status",
    }),
    conversationModel
      .find({
        $or: [{ participant1_id: userId }, { participant2_id: userId }],
      })
      .distinct("_id"),
  ]);

  const unreadConversations = await messageModel.find({
    conversation_id: { $in: conversationIds },
    sender_id: { $ne: userId },
    isRead: false,
  }).distinct("conversation_id");

  return {
    ...user,
    unreadNotificationsCount,
    unreadJobNotificationsCount,
    unreadMessagesCount: unreadConversations.length,
  };
};
