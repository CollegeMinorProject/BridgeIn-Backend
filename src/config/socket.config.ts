import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

// Store online users: { userId: socketId }
const userSocketMap: Record<string, string> = {};
const socketUserMap: Record<string, string> = {};

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

    // Let everyone know who's online
    io!.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("join-room", (data) => {
      const { roomId } = data;
      const Id = socketUserMap[socket.id];
      console.log("User", Id, "joinRoom", roomId);
      socket.join(roomId);
      socket.emit("joined-room", { roomId });
      socket.broadcast.to(roomId).emit("user-joined", { Id });
    });

    socket.on("join-videoCall", (data) => {
      const { roomId, UserId } = data;
      const from = socketUserMap[socket.id];
      console.log(`User ${from} joining video call in room ${roomId}`, data);

      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-joined-call", { from, UserId });
    });

    socket.on("user-join", (data) => {
      const { id, offer } = data;
      const from = socketUserMap[socket.id];
      const socketId = getReceiverSocketId(id);

      if (socketId) {
        io!.to(socketId).emit("incoming-call", { from, offer });
      } else {
        console.log(`User ${id} is not online, cannot deliver call offer`);
      }
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
