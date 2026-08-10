import mongoose from "mongoose";
const tempUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });
export type IUser = mongoose.InferSchemaType<typeof tempUserSchema>;
export const tempUser = mongoose.model("tempUser", tempUserSchema);
