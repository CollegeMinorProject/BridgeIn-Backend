export const OTP_LIFETIME_MS = 5 * 60_000;

export const completedJobRetention = { age: 60 * 60, count: 100 };
export const failedJobRetention = { age: 24 * 60 * 60, count: 100 };

export type EmailJobData = {
  to: string;
  sub: string;
  html: string;
  expiresAt?: number;
};
