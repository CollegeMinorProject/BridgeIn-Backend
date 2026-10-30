import { Router } from "express";
// We will apply this middleware to the test route below so TypeScript knows it is being used!
import { isLoggedInMiddleWare } from "../middleware/isLoggedIn";

const router = Router();

// By adding an underscore to both _req and _res, TypeScript will stop warning you about them.
// We also added isLoggedInMiddleWare here so it is officially "read" and used.
router.get("/test", isLoggedInMiddleWare, (_req: any, _res: any) => {
  console.log("User route hit!");
});

// Add your other user routes down here in the future...

export default router;