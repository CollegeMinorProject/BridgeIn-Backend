import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    commenter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ post_id: 1, createdAt: -1, _id: -1 });

export type CommentDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof commentSchema>;
export type IComment = mongoose.InferSchemaType<typeof commentSchema>;
export const Comment = mongoose.model("Comment", commentSchema);
