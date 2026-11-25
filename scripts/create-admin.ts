import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/user.model";

async function createAdmin() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("Set MONGO_URL in the Server .env file before creating an admin.");
    process.exitCode = 1;
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@bridgein.local";
  const password = process.env.ADMIN_PASSWORD || "123456";

  try {
    await mongoose.connect(mongoUrl);
    await User.init();
    await User.create({ name: "Admin", email, password, role: "admin" });
    console.log(`Admin created. Sign in with ${email}.`);
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      console.error("An account already uses that email. Set ADMIN_EMAIL to create a different admin.");
    } else {
      console.error("Could not create the admin. Check the MongoDB connection and database permissions.");
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void createAdmin();
