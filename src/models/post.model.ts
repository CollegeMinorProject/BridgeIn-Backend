import mongoose from "mongoose";
const postSchema = new mongoose.Schema(
  { //This post belongs to this particular user.
    belong_to: {
      type: mongoose.Schema.Types.ObjectId, //This field will store a MongoDB ObjectId (a special unique ID).
      ref: "User", //This ObjectId belongs to a document in the User model.
      required: true, //this field can't be empty in other words Every post must belong to a user
    },
    text: {
      type: String,
      trim: true, //This automatically removes extra spaces from the beginning and end of the string.
      required: function (this: any) {
        return !this.image; //required if image is not present
      },
    },
    image: {
      type: String,
      trim: true,
      required: function (this: any) {
        return !this.text; //required if text is not present
      },
    },
  },/*A post must have at least one of them (text or image).
      It can have both.
      But it cannot have neither. */
  {
    timestamps: true,
  },
);
export type postDocument = mongoose.Document & //We are creating a new custom type.
  mongoose.InferSchemaType<typeof postSchema>; //TypeScript automatically figures out the shape of the schema (what fields it has and their types).
export type IPost = mongoose.InferSchemaType<typeof postSchema>; //& mongoose.Document → We are combining it with Mongoose’s Document type (so it also has methods like .save(), ._id, etc.).
export const Post = mongoose.model("Post", postSchema); //Creates the actual Model so we can use Post to create/find/update posts in the database.
//We are telling TypeScript:
//“This is what a Post document looks like.”