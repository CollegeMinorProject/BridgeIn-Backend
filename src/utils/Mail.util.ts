import nodemailer from "nodemailer";
import getEnv from "../getEnv";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const host = getEnv.SMTP_HOST;
  const port = Number(getEnv.SMTP_PORT);
  const user = getEnv.SMTP_USER;
  const pass = getEnv.SMTP_PASS;
  const from = getEnv.EMAIL_FROM;
  if (!host || !user || !pass || !from || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Invalid SMTP configuration");
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({ from, to, subject, html });
}
