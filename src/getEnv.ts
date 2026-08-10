let getEnv = {
  Port: process.env.PORT || 5000,
  MONGO_URL: process.env.MONGO_URL || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_USER: process.env.SMTP_USER || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  APP_URL: `${process.env.APP_URL}:${process.env.PORT || 5000}`,
};
export default getEnv;
