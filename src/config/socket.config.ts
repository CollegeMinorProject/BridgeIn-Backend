import { Server } from "socket.io";
import { Server as HttpServer } from "http";

import { verifyAccessToken } from "../utils/token.util";
import { chatRoom, publishPresence, registerChatEvents } from "./chatSocket";

let io: Server | null = null;

const userSockets = new Map<string, Set<string>>();
const isOnline = (userId: string) => userSockets.has(userId);
const interviewRoom = (roomId: string) => `interview:${roomId}`;

// ADDED: per-room whiteboard cache, so a user who joins/refreshes
// gets the current board instead of a blank one. Declared at module
// scope (not inside the connection handler) so it persists across connections.
const whiteboardState: Record<string, any[]> = {};

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  return Array.from(userSockets.get(receiverId) ?? []).at(-1);
};

const getAllowedOrigins = (): string[] => {
  const rawOrigins = process.env.CLIENT_URL || "http://localhost:5173";
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin): origin is string => origin.length > 0);
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  if (io) {
    throw new Error(
      "Socket.io is already initialized. Do not call initializeSocket multiple times.",
    );
  }

  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  const server = io;
  server.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string") throw new Error("Missing token");
      const claims = verifyAccessToken(token);
      if (typeof claims !== "object" || typeof claims._id !== "string" || !/^[a-f0-9]{24}$/i.test(claims._id)) {
        throw new Error("Invalid token");
      }
      socket.data.userId = claims._id.toLowerCase();
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  server.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    const previous = userSockets.get(userId);
    const sockets = previous ?? new Set<string>();
    sockets.add(socket.id);
    userSockets.set(userId, sockets);
    socket.join(chatRoom(userId));
    registerChatEvents(server, socket, userId, isOnline);
    if (!previous) void publishPresence(server, userId, true, isOnline);

    socket.on("join-room", (data) => {
      const { roomId } = data;
      const id = userId;
      console.log("User", id, "joined room", roomId);
      socket.join(interviewRoom(roomId));
      socket.emit("joined-room", { roomId });
      socket.broadcast.to(interviewRoom(roomId)).emit("user-joined", { id });
    });

    socket.on("join-videoCall", (data) => {
      const { id, offer } = data;
      const socketId = getReceiverSocketId(id);
      const from = userId;

      if (!socketId) {
        console.log(`User ${id} is not online, cannot deliver offer`);
        return;
      }

      console.log(`User ${from} sending offer to ${id}`);
      socket.to(socketId).emit("incomming-call", { from, offer });
    });

    socket.on("call-accepted", (data) => {
      const { Id, ans } = data;
      const socketId = getReceiverSocketId(Id);
      if (!socketId) {
        console.log(`User ${Id} is not online, cannot deliver answer`);
        return;
      }
      socket.to(socketId).emit("call-accepted", { ans });
    });

    socket.on("ice-candidate", (data) => {
      const { id, candidate } = data;
      const socketId = getReceiverSocketId(id);
      if (!socketId) return;
      socket.to(socketId).emit("ice-candidate", { candidate });
    });

    // ADDED: relay whiteboard changes to everyone else in the room,
    // and cache the latest full state for late joiners
    socket.on("whiteboard-update", (data) => {
      const { roomId, elements } = data;
      if (!roomId) return;
      whiteboardState[roomId] = elements;
      socket.to(interviewRoom(roomId)).emit("whiteboard-update", { elements });
    });

    // ADDED: send back whatever's cached for this room (empty array if nothing yet)
    socket.on("whiteboard-request-sync", (data) => {
      const { roomId } = data;
      if (!roomId) return;
      const elements = whiteboardState[roomId] ?? [];
      socket.emit("whiteboard-sync", { elements });
    });

    socket.on("disconnect", () => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        void publishPresence(server, userId, false, isOnline);
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Call initializeSocket first.",
    );
  }
  return io;
};
