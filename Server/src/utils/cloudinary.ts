import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import getEnv from "../getEnv";
cloudinary.config({
  cloud_name: getEnv.CLOUDNAME,
  api_key: getEnv.CLOUDINAEY_API_KEY,
  api_secret: getEnv.CLOUDINARY_SECRET,
});
export const uploadOnCloudinary = async (
  localFilePath: string,
): Promise<string | null> => {
  try {
    if (!localFilePath) return null;
    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
      },
    );
    fs.unlinkSync(localFilePath);
    return response.url;
  } catch (error: unknown) {
    fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};
