import mongoose from "mongoose";
const followerSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
export type FollowerDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof followerSchema>;
export type IFollower = mongoose.InferSchemaType<typeof followerSchema>;
export const Follower = mongoose.model("Follower", followerSchema);
