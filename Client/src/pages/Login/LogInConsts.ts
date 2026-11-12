export const AUTH_STEPS = [
  "login",
  "register",
  "getLogInOTP",
  "getPasswordResetOTP",
  "enterLogInOTP",
  "enterPasswordResetOTP",
  "enterOTPtoVerifyEmailAndLogIn",
] as const;
export type AuthStep = (typeof AUTH_STEPS)[number];
export const STEP_COPY: Record<
  AuthStep,
  { title: string; subtitle: (email: string) => string }
> = {
  login: {
    title: "Welcome back",
    subtitle: () => "Log in to continue to your account",
  },
  register: {
    title: "Create an account",
    subtitle: () => "Sign up to get started",
  },
  getLogInOTP: {
    title: "Verifying your email",
    subtitle: (email) => `Sending a code to ${email || "your email"}`,
  },
  enterLogInOTP: {
    title: "Enter verification code",
    subtitle: (email) => `We sent a 6-digit code to ${email || "your email"}`,
  },
  getPasswordResetOTP: {
    title: "Reset your password",
    subtitle: () => "Enter your email and we'll send you a reset code",
  },
  enterPasswordResetOTP: {
    title: "Set a new password",
    subtitle: (email) => `Enter the code sent to ${email || "your email"}`,
  },
  enterOTPtoVerifyEmailAndLogIn: {
    title: "Verify Email",
    subtitle: (email) => `Enter the code sent to ${email || "your email"}`,
  },
};

export const SUBMIT_LABEL: Record<AuthStep, string> = {
  login: "Log In",
  register: "Create account",
  getLogInOTP: "Sending...",
  enterLogInOTP: "Verify email",
  getPasswordResetOTP: "Send reset code",
  enterPasswordResetOTP: "Reset password",
  enterOTPtoVerifyEmailAndLogIn: "Verify email",
};
