import type { Types } from "mongoose";
import { User } from "../../models/user.model";
interface SaveUserDTO {
  _id?: Types.ObjectId;
  refreshTokenHash?: string;
  name: string;
  email: string;
  password: string;
}
export default async function saveUser(data: SaveUserDTO) {
  const user = await User.create(data);
  return user;
}
