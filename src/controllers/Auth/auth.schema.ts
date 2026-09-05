import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(3),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
export const zodisEmail = z.string().email();
export const zodHandleOTPSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});
