import { User } from "../../models/user.model";
export default async function isEmailPresent(email: String) {
  const find = await User.findOne({ email });
  if (find) {
    return true;
  }
  return false;
}
