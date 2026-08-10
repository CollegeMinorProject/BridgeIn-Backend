import { User } from "../../models/user.model";
interface SaveUserDTO {
  name: string;
  email: string;
  password: string;
}
export default async function saveUser({ name, email, password }: SaveUserDTO) {
  const user = await User.create({
    name,
    email,
    password,
  });
  return user;
}
