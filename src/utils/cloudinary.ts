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
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

export const deleteFromCloudinary = async (
  imageUrl: string
): Promise<void> => {
  try {
    if (!imageUrl) return;
    
    // Extract the public ID from the Cloudinary URL (assuming root folder uploads)
    const urlParts = imageUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split(".")[0];
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error: unknown) {
    console.error("Cloudinary deletion failed:", error);
  }
};