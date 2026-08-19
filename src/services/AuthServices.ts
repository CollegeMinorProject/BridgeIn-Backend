import isEmailPresent from "../dao/User/isEmailPresent";
import getEnv from "../getEnv";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/Mail.util";
import saveUser from "../dao/User/saveUser";
import { IUser, User } from "../models/user.model";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/token.util";
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
export const getNewAccessTokenService = async (token: string) => {
  const payload = verifyRefreshToken(token) as { _id: String };
  console.log(JSON.stringify(payload));
  const user = await User.findById(payload._id);
  if (!user || user.refreshToken != token) {
    throw new ApiError(401, "Invalid credential");
  }
  return createAccessToken({ _id: user.id });
};
