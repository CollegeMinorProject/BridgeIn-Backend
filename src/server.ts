import express from "express"; /* Express is a framework that makes it easy to create a web server and handle HTTP requests.
                      Without Express, you would have to write a lot of low-level code using Node’s built-in http module.*/
// @ts-ignore: cookie-parser type declarations are not installed.
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import messageRouter from "./routes/message.routes";
import cors from "cors"; //CORS = Cross-Origin Resource Sharing.
/*This creates an Express application.
Think of app as the main brain of your backend.
All routes, middlewares, and settings will be attached to this app object.*/
const app = express();
//CORS middleware
/*Your frontend (React/Vite) runs on http://localhost:5173
Your backend runs on something like http://localhost:5000 Browsers block requests between different origins by default 
for security.
CORS is the way we tell the browser: “It’s okay, allow this frontend to talk to my backend.” 
origin: "http://localhost:5173" → Only this frontend is allowed.
methods → Which HTTP methods are allowed.
credentials: true → Allows cookies and authentication headers to be sent (very important for login/JWT).*/
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json()); //When the frontend sends data (for example during login or creating a post), that data comes in the request body.
//express.json() → Reads JSON data from the body and puts it in req.body.

app.use(express.urlencoded({ extended: true })); //express.urlencoded({ extended: true }) → Reads form data (like traditional HTML forms).
//Without these two lines, req.body would be empty.
app.use(cookieParser()); //This middleware allows your backend to easily read cookies sent by the browser.
//Cookies are often used to store the refresh token.
//After this line, you can access cookies using req.cookies.
//Mounting routes
/*If inside post.routes.ts there is a route router.post("/", createPost)
Then the final URL becomes: POST /post/
If inside job.routes.ts there is router.get("/", getAllJobs)
Final URL becomes: GET /api/jobs/
authRouter has no prefix, so its routes are used directly (for example /login, /register, etc.). */
app.use(authRouter); //no prefix
app.use("/post", postRouter); //all routes starts with /post
app.use("/user", userRouter); //all routes starts with /user
app.use("/message", messageRouter); //all routes starts with /message
export default app; //We export the fully configured Express app so that index.ts can use it.
