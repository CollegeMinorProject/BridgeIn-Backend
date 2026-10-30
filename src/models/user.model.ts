import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);
type UserBaseType = mongoose.InferSchemaType<typeof userSchema>;
export interface IUser extends UserBaseType, mongoose.Document {
  comparePassword(val: string): Promise<boolean>;
}
userSchema.pre("save", async function (this: IUser) {
  if (this.isModified("password")) {
    let hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
});

userSchema.methods.comparePassword = async function (this: IUser, val: string) {
  return bcrypt.compare(val, this.password);
};
export const User = mongoose.model<IUser>("User", userSchema);
