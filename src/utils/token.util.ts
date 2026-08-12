import jwt from "jsonwebtoken";
import getEnv from "../getEnv";
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
