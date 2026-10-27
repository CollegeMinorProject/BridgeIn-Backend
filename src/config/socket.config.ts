import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

let io: Server | null = null;

const getAllowedOrigins = (): string[] => {
  const rawOrigins = process.env.CLIENT_URL || "http://localhost:5173";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin): origin is string => origin.length > 0);
};

const getJwtFromCookieHeader = (cookieHeader: string): string | null => {
  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name.toLowerCase() === "jwt" && valueParts.length > 0) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

const getUserIdFromToken = (decoded: unknown): string | null => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  const userId = "userId" in decoded ? decoded.userId : undefined;

  return typeof userId === "string" && userId.trim().length > 0 ? userId : null;
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  if (io) {
    throw new Error("Socket.io is already initialized. Do not call initializeSocket multiple times.");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured. Socket authentication cannot start.");
  }

  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error("Authentication Error: No cookies found"));
      }

      const token = getJwtFromCookieHeader(cookieHeader);
      if (!token) {
        return next(new Error("Authentication Error: No token provided in HttpOnly cookie"));
      }

      const decoded = jwt.verify(token, jwtSecret);
      const userId = getUserIdFromToken(decoded);

      if (!userId) {
        return next(new Error("Authentication Error: Malformed token payload missing user identifier"));
      }

      socket.data.userId = userId;
      return next();
    } catch {
      return next(new Error("Authentication Error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Socket] A secure client connected");
    }

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Socket] A secure client disconnected");
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initializeSocket first.");
  }

  return io;
};