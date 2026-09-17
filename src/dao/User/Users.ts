import { User } from "../../models/user.model";

export const UserHasThisId = async (id: string): Promise<boolean> => {
  let user = await User.findById(id);
  return user ? true : false;
};
