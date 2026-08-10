import mongoose from "mongoose";
import getEnv from "../getEnv";
export async function connectToDB() {
  try {
    await mongoose.connect(getEnv.MONGO_URL);
    console.log("Mongo connection is successfully");
  } catch (err) {
    console.log("error while connecting to mongoDB atlast", err);
  }
}
