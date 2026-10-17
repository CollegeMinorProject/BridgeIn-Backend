const mongoose = require("mongoose");
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
      ref: "user",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);
likeSchema.index({ postid: 1, LikedBy: 1 }, { unique: true });

module.exports = mongoose.model("like", likeSchema);
