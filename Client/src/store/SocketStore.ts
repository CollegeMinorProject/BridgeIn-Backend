import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";

const backendURL = "http://localhost:3000";

interface SocketState {
  socket: Socket | null;
  setSocket: (role: string) => void;
  disconnectSocket: (isLogIn: boolean) => void;
}

export const useSocketStore = create<SocketState>()(
  devtools(
    persist(
      (set, get) => ({
        socket: null,
        setSocket: (role: string) => {
          if (get().socket) return;
          const socket = io(backendURL, {
            query: { role },
          });
          socket.connect();
          set({ socket });
        },
        disconnectSocket: (isLogIn: boolean) => {
          const { socket } = get();
          if (socket) {
            socket.disconnect();
          }
          set({ socket: isLogIn ? get().socket : null });
        },
      }),
      {
        name: "socket-store",
        partialize: () => ({}),
      },
    ),
  ),
);
