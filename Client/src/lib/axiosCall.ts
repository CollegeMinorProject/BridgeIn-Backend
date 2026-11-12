import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthTokenStore } from "@/store/AuthStore";
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RefreshResponse {
  accessToken: string;
  role?: string; // only if your backend returns it
}

const REFRESH_URL = "/getNewAccessToken";
const PUBLIC_URLS = ["/auth/login", "/auth/register"]; // change to your real routes

// Login, register and the refresh call itself must never trigger a refresh
const isPublicRequest = (url?: string): boolean =>
  !!url && [...PUBLIC_URLS, REFRESH_URL].some((path) => url.includes(path));

const axiosCall = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // sends the refreshToken cookie
  headers: { "Content-Type": "application/json" },
});

// Attach the access token from zustand to every request
axiosCall.interceptors.request.use((config) => {
  const { accessToken } = useAuthTokenStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let waitingQueue: QueueItem[] = [];

const processQueue = (error: unknown | null, token = ""): void => {
  waitingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  waitingQueue = [];
};

axiosCall.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // No config means it's not a normal request error, just pass it on
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isPublicRequest(originalRequest.url)) {
        return Promise.reject(error);
      }

      // A refresh is already running: wait for it, then retry with the new token
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosCall(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token goes as a cookie; new access token comes back in the JSON
        const { data } = await axiosCall.post<RefreshResponse>(REFRESH_URL);

        // Save the new token (and role) in zustand
        const store = useAuthTokenStore.getState();
        store.logIn({
          accessToken: data.accessToken,
          role: data.role ?? store.role, // keep the old role if the backend doesn't send one
        });

        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosCall(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthTokenStore.getState().logout(); // clears token, role and isLogIn
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosCall;
