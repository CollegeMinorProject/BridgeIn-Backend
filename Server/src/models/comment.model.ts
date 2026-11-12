import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    commenter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postid: {
      type: String,
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

export type CommentDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof commentSchema>;
export type IComment = mongoose.InferSchemaType<typeof commentSchema>;
export const Comment = mongoose.model("Comment", commentSchema);
