import mongoose from "mongoose";

export const UPGRADE_STATUSES = ["pending", "approved", "rejected"] as const;
export type UpgradeStatus = (typeof UPGRADE_STATUSES)[number];

const roleUpgradeRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: UPGRADE_STATUSES,
        message: "{VALUE} is not a valid request status",
      },
      default: "pending",
    },
    // admin who approved / rejected the request
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// a user can only have one pending request at a time
roleUpgradeRequestSchema.index(
  { user_id: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);
roleUpgradeRequestSchema.index({ status: 1, createdAt: -1 });
export type RoleUpgradeRequestDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof roleUpgradeRequestSchema>;
export type IRoleUpgradeRequest = mongoose.InferSchemaType<
  typeof roleUpgradeRequestSchema
>;
export const RoleUpgradeRequest = mongoose.model(
  "RoleUpgradeRequest",
  roleUpgradeRequestSchema,
);
