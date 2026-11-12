import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string;
  role: string;
  isLogIn: boolean;
  setAccessToken: (accessToken: string) => void;
  setRole: (role: string) => void;
  setLogIn: (isLogIn: boolean) => void;
  logIn: (data: { accessToken: string; role: string }) => void;
  logout: () => void;
}

export const useAuthTokenStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: "",
        role: "",
        isLogIn: false,
        setAccessToken: (accessToken) =>
          set({ accessToken }, false, "setAccessToken"),
        setRole: (role) => set({ role }, false, "setRole"),
        setLogIn: (isLogIn) => set({ isLogIn }, false, "setLogIn"),
        logIn: ({ accessToken, role }) =>
          set({ accessToken, role, isLogIn: true }, false, "logIn"),
        logout: () =>
          set({ accessToken: "", role: "", isLogIn: false }, false, "logout"),
      }),
      {
        name: "auth-store",
        partialize: (state) => ({ role: state.role, isLogIn: state.isLogIn }),
      },
    ),
  ),
);
