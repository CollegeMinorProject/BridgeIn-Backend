import mongoose from "mongoose";

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    postid: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    LikedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ postid: 1, LikedBy: 1 }, { unique: true });

const Like = mongoose.model("like", likeSchema);

export default Like;