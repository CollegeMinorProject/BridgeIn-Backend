function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
function getOptionalEnv(key: string, defaultValue = "") {
  return process.env[key] || defaultValue;
}

let getEnv = {
  Port: getOptionalEnv("PORT", "5000"),
  MONGO_URL: getRequiredEnv("MONGO_URL"),
  SMTP_HOST: getRequiredEnv("SMTP_HOST"),
  SMTP_PORT: getOptionalEnv("SMTP_PORT", "587"),
  SMTP_PASS: getRequiredEnv("SMTP_PASS"),
  SMTP_USER: getRequiredEnv("SMTP_USER"),
  EMAIL_FROM: getRequiredEnv("EMAIL_FROM"),
  JWT_ACCESS_SECRET: getRequiredEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getRequiredEnv("JWT_REFRESH_SECRET"),
  APP_URL: `${getRequiredEnv("APP_URL")}:${getOptionalEnv("PORT", "5000")}`,
  GOOGLE_CLIENT_SECRET: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CLIENT_ID: getRequiredEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_REDIRECT_URL: getRequiredEnv("GOOGLE_REDIRECT_URL"),
  CLOUDINARY_SECRET: getRequiredEnv("CLOUDINARY_SECRET"),
  CLOUDINARY_API_KEY: getRequiredEnv("CLOUDINARY_APIKEY"),
  CLOUDNAME: getRequiredEnv("CLOUDNAME"),
  REDIS_URL: getOptionalEnv("REDIS_URL", ""),
};

export default getEnv;
