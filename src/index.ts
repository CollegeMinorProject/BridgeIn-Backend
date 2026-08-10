import app from "./server";
import { connectToDB } from "./config/db.confit";
import getEnv from "./getEnv";
async function startServer() {
  await connectToDB();
  app.listen(getEnv.Port, () => {
    console.log(`Server is now listening to port ${getEnv.Port}`);
  });
}
startServer().catch((err) => {
  console.log("Error while starting the server", err);
  process.exit(1);
});
