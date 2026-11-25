import mongoose from "mongoose";
const followerSchema = new mongoose.Schema(
  {
    main_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);
followerSchema.path("followed_by").validate(function (value) {
  return !this.main_id || String(value) !== String(this.main_id);
}, "A user cannot follow themselves");
followerSchema.index({ main_id: 1, followed_by: 1 }, { unique: true });
export type FollowerDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof followerSchema>;
export type IFollower = mongoose.InferSchemaType<typeof followerSchema>;
export const Follower = mongoose.model("Follower", followerSchema);
