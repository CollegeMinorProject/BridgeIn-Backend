import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { User } from "../../models/user.model";
import { deleteAvatar, uploadAvatar } from "../../utils/cloudinary";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import {
  getProfileDataService,
  getUserPostService,
  getUserFeedService,
  getJobFeedService,
} from "../../services/UserServices";
import { httpStatusCodes } from "../../utils/APIResponse";

const profileUpdate = z.object({
  name: z.string().trim().min(3).max(100),
  headline: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  skills: z.array(z.string().trim().min(1).max(50)).max(20),
});

export const updateOwnProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  let fields = req.body;
  if (req.is("multipart/form-data")) {
    try {
      fields = { ...fields, skills: JSON.parse(fields?.skills ?? "null") };
    } catch {
      throw new ApiError(400, "Invalid skills list");
    }
  }
  const result = profileUpdate.safeParse(fields);
  if (!result.success) throw new ApiError(400, result.error.issues[0].message);

  const filter: { _id: string; avatar_public_id?: string | null } = { _id: req.user };
  const existing = req.file ? await User.findById(req.user).select("avatar_public_id").lean() : null;
  let image: Awaited<ReturnType<typeof uploadAvatar>> | undefined;
  if (req.file) {
    if (!existing) throw new ApiError(404, "Profile not found");
    filter.avatar_public_id = existing.avatar_public_id ?? null;
    try {
      image = await uploadAvatar(req.file.buffer);
    } catch {
      throw new ApiError(502, "Could not upload the profile image");
    }
  }

  const user = await User.findOneAndUpdate(filter, {
    $set: { ...result.data, ...(image && { avatar: image.url, avatar_public_id: image.publicId }) },
  }, { new: true, runValidators: true })
    .select("_id name email avatar role headline description skills createdAt updatedAt").lean()
    .catch(async (error: unknown) => {
      if (image) {
        // A connection error may occur after MongoDB accepted the update.
        const saved = await User.exists({ _id: filter._id, avatar_public_id: image.publicId })
          .catch(() => undefined);
        if (saved === null) await deleteAvatar(image.publicId);
      }
      throw error;
    });
  if (!user) {
    await deleteAvatar(image?.publicId);
    if (image) throw new ApiError(409, "Your profile image changed. Reload and try again.");
    throw new ApiError(404, "Profile not found");
  }
  if (image) await deleteAvatar(existing?.avatar_public_id);
  res.json(new ApiResponse(200, user, "Profile updated"));
});

export const getProfileData = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    if (id == null) {
      throw new ApiError(400, "Invalid requestions");
    }
    let data = await getProfileDataService(id, req.user);
    res.status(200).json(new ApiResponse(200, data, httpStatusCodes[200]));
  },
);
export const getUserFeed = asyncHandler(async (req: Request, res: Response) => {
  let id = req.user as string;
  const limit = Math.min(
    Math.max(Number.parseInt(String(req.query.limit), 10) || 30, 1),
    50,
  );
  const page = Math.max(Number.parseInt(String(req.query.page), 10) || 1, 1);
  let data = await getUserFeedService(id, limit, page);
  res.status(200).json(new ApiResponse(200, data, httpStatusCodes[200]));
});
export const getUserJobFeed = asyncHandler(
  async (req: Request, res: Response) => {
    let id = req.user as string;
    const limit = Math.min(
      Math.max(Number.parseInt(String(req.query.limit), 10) || 30, 1),
      50,
    );
    const page = Math.max(Number.parseInt(String(req.query.page), 10) || 1, 1);
    getUserJobFeed;
    let data = await getJobFeedService(id, limit, page);
    res.status(200).json(new ApiResponse(200, data, httpStatusCodes[200]));
  },
);
export const getUserPosts = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const id = req.query.userId ?? req.user;
    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid profile ID");
    const limit = Math.max(1, Math.min(50, Number.parseInt(String(req.query.limit ?? req.params.limit), 10) || 20));
    const page = Math.max(1, Math.min(100_000, Number.parseInt(String(req.query.page ?? req.params.page), 10) || 1));
    const data = await getUserPostService(id, limit, page, req.user);
    res.status(200).json(new ApiResponse(200, data, "success"));
  },
);
