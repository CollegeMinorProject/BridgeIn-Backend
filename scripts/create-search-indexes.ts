import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";
import { jobSearchIndex, profileSearchIndex } from "../src/config/searchIndexes";
import { JobPost } from "../src/models/jobPost.model";
import { User } from "../src/models/user.model";

async function createSearchIndexes() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error("Set MONGO_URL before creating search indexes.");

  await mongoose.connect(mongoUrl, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 5_000,
  });
  const db = mongoose.connection.getClient().db(mongoose.connection.name);

  for (const { collectionName, index } of [
    { collectionName: User.collection.name, index: profileSearchIndex },
    { collectionName: JobPost.collection.name, index: jobSearchIndex },
  ]) {
    const collection = db.collection(collectionName);
    const [existing] = await collection.listSearchIndexes(index.name).toArray();
    if (!existing) {
      await collection.createSearchIndex(index);
      console.log(`${collectionName}.${index.name}: creation requested. Rerun this command to check its status.`);
    } else if (!isDeepStrictEqual(existing.latestDefinition, index.definition)) {
      await collection.updateSearchIndex(index.name, index.definition);
      console.log(`${collectionName}.${index.name}: update requested. Rerun this command to check its status.`);
    } else {
      console.log(`${collectionName}.${index.name}: ${existing.status}`);
    }
  }
}

createSearchIndexes()
  .catch((error: unknown) => {
    console.error("Could not set up search indexes:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
