import getEnv from "../getEnv";
import { OAuth2Client } from "google-auth-library";
import { ApiError } from "./ErrorHandling.ts/APIError";
export default function getGoogleClient() {
  const clientId = getEnv.GOOGLE_CLIENT_ID;
  const clientSecret = getEnv.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "Internal Server Error");
  }
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: "postmessage",
  });
}
