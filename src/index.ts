import "dotenv/config.js";
import http from "http";
import app from "./server";
import { connectToDB } from "./config/db.confit";
import getEnv from "./getEnv";
import "./queues/worker/worker";
import { initializeSocket } from "./config/socket.config";

async function startServer() {
  await connectToDB();
  const httpServer = http.createServer(app);
  initializeSocket(httpServer);
  httpServer.listen(getEnv.Port, () => {
    console.log(`Server is now listening to port ${getEnv.Port}`);
  });
}
startServer().catch((err) => {
  console.log("Error while starting the server", err);
  process.exit(1);
});
