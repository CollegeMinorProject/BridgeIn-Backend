import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: undefined },
  },
  {
    timestamps: true,
  },
);
type UserDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof userSchema>;
userSchema.pre("save", async function (this: UserDocument) {
  if (this.isModified("password")) {
    let hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
});
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  val: string,
) {
  return bcrypt.compare(val, this.password);
};
export type IUser = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model("User", userSchema);
