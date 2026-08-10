import { tempUser } from "../../models/tempUser.model";
export async function findAndDeleteTempUser(email: string) {
  await tempUser.findOneAndDelete({ email });
}
