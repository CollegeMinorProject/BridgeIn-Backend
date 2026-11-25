import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { randomUUID } from "node:crypto";
import getEnv from "../getEnv";
cloudinary.config({
  cloud_name: getEnv.CLOUDNAME,
  api_key: getEnv.CLOUDINARY_API_KEY,
  api_secret: getEnv.CLOUDINARY_SECRET,
});

const avatarPrefix = "bridgein/avatars/";

export function uploadAvatar(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "image", public_id: `${avatarPrefix}${randomUUID()}` },
      (error, result) => {
        if (error || !result) return reject(new Error("Avatar upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    ).end(buffer);
  });
}

export async function deleteAvatar(publicId?: string | null) {
  if (!publicId?.startsWith(avatarPrefix)) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
    .catch(() => console.error("Could not clean up a profile image"));
}
export const uploadOnCloudinary = async (
  localFilePath: string,
): Promise<{ url: string; publicId: string } | null> => {
  try {
    if (!localFilePath) return null;
    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
      },
    );
    return { url: response.secure_url, publicId: response.public_id };
  } catch (error: unknown) {
    console.error("Cloudinary upload failed:", error);
    return null;
  } finally {
    if (localFilePath) await fs.promises.rm(localFilePath, { force: true }).catch(console.error);
  }
};


const resumePrefix = "bridgein/resumes/";

export function uploadResume(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "raw", type: "authenticated", public_id: `${resumePrefix}${randomUUID()}.pdf` },
      (error, result) => {
        if (error || !result) return reject(new Error("Resume upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    ).end(buffer);
  });
}

export function resumeDownloadUrl(url: string, publicId?: string | null) {
  if (!publicId?.startsWith(resumePrefix)) return url;
  return cloudinary.url(publicId, {
    resource_type: "raw", type: "authenticated", secure: true, sign_url: true,
  });
}

export async function deleteResume(publicId: string) {
  if (!publicId.startsWith(resumePrefix)) return;
  const { result } = await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated", invalidate: true });
  if (result !== "ok" && result !== "not found") throw new Error("Resume file could not be deleted");
}
