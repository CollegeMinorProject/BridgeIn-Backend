import "dotenv/config"; //to ensure environment variables load before the server starts
import http from "http";
import app from "./server";
import { connectToDB } from "./config/db.confit";
import getEnv from "./getEnv";
import "./queues/worker/worker";
import { initializeSocket } from "./config/socket.config";

async function startServer() {
  await connectToDB();

  // Wrap the Express app with a standard HTTP server
  const httpServer = http.createServer(app);

  // Attach Socket.io to the HTTP server
  initializeSocket(httpServer);

  // Start listening using the HTTP server instead of Express directly
  httpServer.listen(getEnv.Port, () => {
    console.log(`Server is now listening to port ${getEnv.Port}`);
  });
}

startServer().catch((err) => {
  console.log("Error while starting the server", err);
  process.exit(1);
});