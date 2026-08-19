import mongoose from "mongoose";
const postSchema = new mongoose.Schema(
  {
    belong_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      required: function (this: any) {
        return !this.image;
      },
    },
    image: {
      type: String,
      trim: true,
      required: function (this: any) {
        return !this.text;
      },
    },
  },
  {
    timestamps: true,
  },
);
export type postDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof postSchema>;
export type IPost = mongoose.InferSchemaType<typeof postSchema>;
export const Post = mongoose.model("Post", postSchema);
