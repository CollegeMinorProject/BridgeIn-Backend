import mongoose from "mongoose";

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    liked_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

likeSchema.index({ post_id: 1, liked_by: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema, "likes");

export default Like;