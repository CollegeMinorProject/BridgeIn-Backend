import mongoose from "mongoose";
import bcrypt from "bcrypt";
export const USER_ROLES = ["candidate", "recruiter", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "candidate",
      required: true,
    },
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
  //This adds a custom method to every user document.
  //Later, when a user tries to login, we can do: it will return true or false
  this: UserDocument,
  val: string,
) {
  return bcrypt.compare(val, this.password);
};

export type IUser = mongoose.Document &
  mongoose.InferSchemaType<typeof userSchema> & {
    comparePassword(val: string): Promise<boolean>;
  };

export const User = mongoose.model("User", userSchema); //"User" → Name of the model (MongoDB will create a collection called users)
//userSchema → The blueprint we created
