import { Router } from "express";
import { Types } from "mongoose";
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";
import { RoleUpgradeRequest } from "../models/roleUpgradeRequest.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../utils/ErrorHandling.ts/asyncHandler";

const router = Router();
router.use(isLoggedInMiddleWare);

async function requireAdmin(userId?: string) {
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!await User.exists({ _id: userId, role: "admin" })) throw new ApiError(403, "Admin access required");
  return userId;
}

router.post("/", asyncHandler(async (req, res) => {
  if (!req.user || !await User.exists({ _id: req.user, role: "candidate" })) {
    throw new ApiError(403, "Only candidates can request recruiter access");
  }
  await RoleUpgradeRequest.init();
  let request;
  try {
    request = await RoleUpgradeRequest.findOneAndUpdate(
      { user_id: req.user, status: "pending" },
      { $setOnInsert: { user_id: req.user, status: "pending" } },
      { upsert: true, new: true, runValidators: true },
    );
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
    request = await RoleUpgradeRequest.findOne({ user_id: req.user, status: "pending" });
  }
  if (!request) throw new ApiError(409, "Your request changed. Refresh your profile.");
  res.json(new ApiResponse(200, { status: request.status }, "Recruiter request submitted"));
}));

router.get("/", asyncHandler(async (req, res) => {
  await requireAdmin(req.user);
  const requests = await RoleUpgradeRequest.find().populate("user_id", "name headline avatar")
    .sort({ createdAt: -1, _id: -1 }).lean();
  res.json(new ApiResponse(200, requests));
}));

router.get("/mine", asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  const request = await RoleUpgradeRequest.findOne({ user_id: req.user })
    .sort({ createdAt: -1, _id: -1 }).select("status").lean();
  res.json(new ApiResponse(200, { status: request?.status ?? null }));
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req.user);
  const { id } = req.params;
  const status = req.body?.status;
  if (typeof id !== "string" || !Types.ObjectId.isValid(id) || (status !== "approved" && status !== "rejected")) {
    throw new ApiError(400, "Invalid recruiter request or decision");
  }
  const filter = { _id: id, status: "pending" } as const;
  const change = { $set: { status, reviewed_by: admin, reviewedAt: new Date() } };
  if (status === "approved") {
    await User.db.transaction(async session => {
      const request = await RoleUpgradeRequest.findOneAndUpdate(filter, change, { session, new: true, runValidators: true });
      if (!request) throw new ApiError(409, "This recruiter request has already been reviewed");
      const updated = await User.updateOne({ _id: request.user_id, role: "candidate" }, { $set: { role: "recruiter" } }, { session, runValidators: true });
      if (!updated.matchedCount) throw new ApiError(409, "The requester is no longer a candidate");
    });
  } else {
    const request = await RoleUpgradeRequest.findOneAndUpdate(filter, change, { runValidators: true });
    if (!request) throw new ApiError(409, "This recruiter request has already been reviewed");
  }
  res.json(new ApiResponse(200, { status }));
}));

export default router;
