import jwt from "jsonwebtoken";
import getEnv from "../getEnv";

export function createAccessToken(userId: string) {
  const payload = { _id: userId };
  return jwt.sign(payload, getEnv.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });
}

export function createRefreshToken(userId: string) {
  const payload = { id: userId };
  return jwt.sign(payload, getEnv.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });
}
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, getEnv.JWT_ACCESS_SECRET) as {
    id: String;
  };
}
