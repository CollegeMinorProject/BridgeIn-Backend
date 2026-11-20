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
export const OnlyEmailSchema = z.object({
  email: z.email(),
});
export const LogInWithOtpSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(6),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});
export const zodisEmail = z.email();
export const zodHandleOTPSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});
export const RegisterEmailOTPVerificationSchema = z.object({
  email: z.email(),
  otp: z.string().length(6),
});
