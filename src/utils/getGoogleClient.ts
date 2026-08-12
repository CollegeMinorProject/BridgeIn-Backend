import getEnv from "../getEnv";
import { OAuth2Client } from "google-auth-library";
export default function getGoogleClient() {
  const clientId = getEnv.GOOGLE_CLIENT_ID;
  const clientSecret = getEnv.GOOGLE_CLIENT_SECRET;
  const redirectUrl = getEnv.GOOGLE_REDIRECT_URL;
  if (!clientId || !clientSecret || !redirectUrl) {
    throw new Error("Google client id and secret both are missing");
  }
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUrl,
  });
}
