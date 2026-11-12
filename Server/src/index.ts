import "dotenv/config.js"
import http from "http"; /*This is Node.js’s built-in module for creating raw HTTP servers.
                          We need it because we want to use Socket.io (real-time chat). Socket.io cannot attach directly to Express; it needs a normal Node.js HTTP server. */
import app from "./server"; //app is the Express instance that already has all the routes, middlewares, CORS, etc. configured.
import { connectToDB } from "./config/db.confit"; //Imports the function that connects your app to MongoDB using Mongoose.
                                                  //Note: the filename has a small typo (db.confit instead of db.config), but it works.
import getEnv from "./getEnv";/*This is a small helper object that reads values from process.env with default fallbacks.
                                Example: getEnv.Port will be process.env.PORT or 5000 if not set.*/ 
import "./queues/worker/worker";/*This is a side-effect import.
                                  Just by importing this file, the background job worker (BullMQ) starts running.
                                  We don’t use any export from it; we only want it to start working when the server starts. */
import { initializeSocket } from "./config/socket.config"; //Imports the function that sets up Socket.io (real-time messaging).

async function startServer() {
  await connectToDB(); //1. first connect to mongodb 

  //2. Wrap the Express app with a standard HTTP server / create a real http server and pass express app to it
  const httpServer = http.createServer(app);

  //3. Attach Socket.io to the HTTP server
  initializeSocket(httpServer);

  //4. Start listening using the HTTP server instead of Express directly / start listening for request
  httpServer.listen(getEnv.Port, () => {
    console.log(`Server is now listening to port ${getEnv.Port}`);
  });
}
//5. Error handling
/*startServer() is an async function, so it returns a Promise.
If anything fails (especially database connection), the .catch() will run.
process.exit(1) means “crash the program with an error code”. 
This is important in production so the process manager (PM2, Docker, etc.) knows something went wrong and can restart it. */
startServer().catch((err) => {
  console.log("Error while starting the server", err);
  process.exit(1);
});