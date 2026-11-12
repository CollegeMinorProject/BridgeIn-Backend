import jwt from "jsonwebtoken";
import getEnv from "../getEnv";
import { Response } from "express";
export function createAccessToken(payload: any) {
  return jwt.sign(payload, getEnv.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });
}
export function createRefreshToken(payload: any) {
  return jwt.sign(payload, getEnv.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, getEnv.JWT_REFRESH_SECRET);
}
export function verifyAccessToken(token: string) {
  return jwt.verify(token, getEnv.JWT_ACCESS_SECRET);
}
export function setRefreshTokenAndAccessTokenInCookies(
  res: Response,
  refreshToken: string,
  accessToken: string,
): void {
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
}
export function setAccessTokenInCookies(
  res: Response,
  accessToken: string,
): void {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 12 * 60 * 60 * 1000,
  });
}
