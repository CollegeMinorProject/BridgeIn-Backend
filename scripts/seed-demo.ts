import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { JobPost } from "../src/models/jobPost.model";
import { Post } from "../src/models/post.model";
import { User } from "../src/models/user.model";
import { demoSeedId } from "../src/utils/demoSeedId";

const password = "1";
const postsPerAccount = 10;
const groups = [
  { prefix: "user", role: "candidate", count: 50, jobsPerAccount: 0 },
  { prefix: "recruiter", role: "recruiter", count: 10, jobsPerAccount: 5 },
  { prefix: "admin", role: "admin", count: 1, jobsPerAccount: 5 },
] as const;

async function seedDemo() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error("Set MONGO_URL in the Server .env before seeding demo data.");

  await mongoose.connect(mongoUrl);
  await User.init();
  const now = new Date();
  const posts = [];
  const jobs = [];
  let accounts = 0;

  for (const { prefix, role, count, jobsPerAccount } of groups) {
    for (let index = 1; index <= count; index++) {
      const name = `${prefix}${index}`;
      const email = `${name}@bridgein.local`;
      const userId = demoSeedId(`user:${name}`);
      const existing = await User.findOne({ $or: [{ _id: userId }, { email }] }).select("email password");

      if (existing) {
        if (!existing._id.equals(userId) || existing.email !== email) {
          throw new Error(`Demo account conflicts with an existing user: ${email}`);
        }
        if (!await bcrypt.compare(password, existing.password)) {
          existing.password = password;
          existing.refreshTokenHash = "";
          await existing.save();
        }
      } else {
        // Use the User model so its save hook hashes the password with bcrypt.
        await User.create({ _id: userId, name, email, password, role });
      }
      accounts++;

      for (let number = 1; number <= postsPerAccount; number++) {
        const text = `post${prefix}${(index - 1) * postsPerAccount + number}`;
        const id = demoSeedId(`post:${text}`);
        posts.push({ updateOne: {
          filter: { _id: id },
          update: { $setOnInsert: { belong_to: userId, text, createdAt: now, updatedAt: now } },
          upsert: true,
          timestamps: false,
        } });
      }

      for (let number = 1; number <= jobsPerAccount; number++) {
        const title = `jobpost${prefix}${(index - 1) * jobsPerAccount + number}`;
        const id = demoSeedId(`job:${title}`);
        jobs.push({ updateOne: {
          filter: { _id: id },
          update: { $setOnInsert: {
            posted_by: userId,
            title,
            company_name: "BridgeIn Demo",
            location: "Remote",
            job_type: "full-time" as const,
            description: `Demo opening posted by ${name}.`,
            requirements: "Experience building web applications.",
            skills_required: ["JavaScript", "React"],
            isOpen: true,
            createdAt: now,
            updatedAt: now,
          } },
          upsert: true,
          timestamps: false,
        } });
      }
    }
  }

  await Post.bulkWrite(posts, { ordered: false });
  await JobPost.bulkWrite(jobs, { ordered: false });
  console.log(`Demo data ready: ${accounts} accounts, ${posts.length} posts, and ${jobs.length} job posts.`);
  console.log("Sign in with <username>@bridgein.local and the seeded password.");
}

void seedDemo()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Could not seed demo data.");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
