import { User, IUser } from "../../models/user.model";
export default async function isEmailPresent(
  email: string,
): Promise<IUser | null> {
  const find: IUser | null = await User.findOne({ email });
  return find;
}
