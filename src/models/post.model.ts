import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    belong_to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, trim: true, required: true },
    image: { type: String, trim: true },
    image_public_id: { type: String, trim: true },
  },
  { timestamps: true },
);

export type IPost = mongoose.InferSchemaType<typeof postSchema>;
export type postDocument = mongoose.HydratedDocument<IPost>;
export const Post = mongoose.model("Post", postSchema);
