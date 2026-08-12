import nodemailer from "nodemailer";
import getEnv from "../getEnv";
export async function sendEmail(to: string, subject: string, html: string) {
  const host: String = getEnv.SMTP_HOST;
  const port: Number = Number(getEnv.SMTP_PORT);
  const pass: String = getEnv.SMTP_PASS;
  const user: String = getEnv.SMTP_USER;
  const from: String = getEnv.EMAIL_FROM;
  if (!host || !pass || !user) {
    console.log("Email env are not available");
    return;
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
