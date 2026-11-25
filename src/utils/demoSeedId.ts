import { createHash } from "node:crypto";
import { Types } from "mongoose";

export function demoSeedId(key: string) {
  return new Types.ObjectId(createHash("sha256").update(`bridgein-demo:${key}`).digest("hex").slice(0, 24));
}

export function isSeededDemoAccount(email: string, id: Types.ObjectId) {
  const match = /^(user(?:[1-9]|[1-4]\d|50)|recruiter(?:[1-9]|10)|admin1)@bridgein\.local$/.exec(email);
  return Boolean(match && id.equals(demoSeedId(`user:${match[1]}`)));
}
