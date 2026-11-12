import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import {
  getProfileDataService,
  getUserPostService,
  getUserFeedService,
  getJobFeedService,
  getUserSearchFeedService,
} from "../../services/UserServices";
import { httpStatusCodes } from "../../utils/APIResponse";

export const getProfileData = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    if (id == null) {
      throw new ApiError(400, "Invalid requestions");
    }
    let data = await getProfileDataService(id);
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
    const id = req.user as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const data = await getUserPostService(id, limit, page);
    res.status(200).json(new ApiResponse(200, data, "success"));
  },
);
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  let searchString = req.query.searchString as string;
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;
  let data = await getUserSearchFeedService(searchString, limit, page);
  res.status(200).json(new ApiResponse(200, data, "success"));
});
