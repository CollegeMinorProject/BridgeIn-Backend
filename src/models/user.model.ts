import mongoose from "mongoose"; //The library that helps us work with MongoDB easily.
import bcrypt from "bcrypt"; //A library used to hash (encrypt) passwords so we never store plain text passwords in the database.

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
//This is just TypeScript telling the code:
//“A User document will have all the fields from the schema + a method called comparePassword.”
type UserDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof userSchema>;
//This is called a pre-save middleware
/*Before saving a user to the database, run this function.
this.isModified("password") → Check if the password field was changed.
If yes, then hash the password using bcrypt.
bcrypt.hash(password, 10) → 10 is the salt rounds (how strong the hashing should be).
Then replace the plain password with the hashed version.
Why do we do this?
We should never store the real password in the database. If the database is ever leaked, the real passwords are still safe. */
userSchema.pre("save", async function (this: UserDocument) {
  if (this.isModified("password")) {
    let hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
});
userSchema.methods.comparePassword = async function ( //This adds a custom method to every user document.
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
