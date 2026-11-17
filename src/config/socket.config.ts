import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

const userSocketMap: Record<string, string> = {};
const socketUserMap: Record<string, string> = {};

// ADDED: per-room whiteboard cache, so a user who joins/refreshes
// gets the current board instead of a blank one. Declared at module
// scope (not inside the connection handler) so it persists across connections.
const whiteboardState: Record<string, any[]> = {};

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId];
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

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`[Socket] User ${userId} connected`, socket.id);

    if (userId) {
      userSocketMap[userId] = socket.id;
      socketUserMap[socket.id] = userId;
    }

    io!.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("join-room", (data) => {
      const { roomId } = data;
      const id = socketUserMap[socket.id];
      console.log("User", id, "joined room", roomId);
      socket.join(roomId);
      socket.emit("joined-room", { roomId });
      socket.broadcast.to(roomId).emit("user-joined", { id });
    });

    socket.on("join-videoCall", (data) => {
      const { id, offer } = data;
      const socketId = userSocketMap[id];
      const from = socketUserMap[socket.id];

      if (!socketId) {
        console.log(`User ${id} is not online, cannot deliver offer`);
        return;
      }

      console.log(`User ${from} sending offer to ${id}`);
      socket.to(socketId).emit("incomming-call", { from, offer });
    });

    socket.on("call-accepted", (data) => {
      const { Id, ans } = data;
      const socketId = userSocketMap[Id];
      if (!socketId) {
        console.log(`User ${Id} is not online, cannot deliver answer`);
        return;
      }
      socket.to(socketId).emit("call-accepted", { ans });
    });

    socket.on("ice-candidate", (data) => {
      const { id, candidate } = data;
      const socketId = userSocketMap[id];
      if (!socketId) return;
      socket.to(socketId).emit("ice-candidate", { candidate });
    });

    // ADDED: relay whiteboard changes to everyone else in the room,
    // and cache the latest full state for late joiners
    socket.on("whiteboard-update", (data) => {
      const { roomId, elements } = data;
      if (!roomId) return;
      whiteboardState[roomId] = elements;
      socket.to(roomId).emit("whiteboard-update", { elements });
    });

    // ADDED: send back whatever's cached for this room (empty array if nothing yet)
    socket.on("whiteboard-request-sync", (data) => {
      const { roomId } = data;
      if (!roomId) return;
      const elements = whiteboardState[roomId] ?? [];
      socket.emit("whiteboard-sync", { elements });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected`, socket.id);
      if (userId) {
        delete socketUserMap[socket.id];
        delete userSocketMap[userId];
        io!.emit("getOnlineUsers", Object.keys(userSocketMap));
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
