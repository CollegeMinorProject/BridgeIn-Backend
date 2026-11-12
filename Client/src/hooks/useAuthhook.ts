import { useState } from "react";
import axios from "axios";
import axiosCall from "../lib/axiosCall";
import { useAuthTokenStore } from "@/store/AuthStore";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    role: string;
  };
}
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface RegisterOTPCredentials {
  email: string;
  otp: string;
}

export interface VerifyRegisterResponse {
  accessToken: string;
  role: string; // backend must return this
}

export interface UseAuthReturn {
  login: (email: string, password: string) => Promise<LoginResponse | null>;
  logout: () => Promise<void>;
  handleGoogleSignIn: () => void;
  registerRequest: (
    name: string,
    email: string,
    password: string,
  ) => Promise<RegisterResponse | null>;
  verifyRegister: (email: string, otp: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const logIn = useAuthTokenStore((s) => s.logIn);
  const clearAuth = useAuthTokenStore((s) => s.logout);

  const run = async <T>(action: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message);
      } else {
        setError("An unexpected error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = (
    email: string,
    password: string,
  ): Promise<LoginResponse | null> =>
    run(async () => {
      const credentials: LoginCredentials = { email, password };
      const { data } = await axiosCall.post<LoginResponse>(
        "/login",
        credentials,
      );
      logIn({ accessToken: data.data.accessToken, role: data.data.role });
      return data;
    });

  const handleGoogleSignIn = useGoogleLogin({
    flow: "auth-code",
    onSuccess: (codeResponse) => {
      run(async () => {
        // axiosCall (not plain axios) so baseURL and credentials are consistent
        const { data } = await axiosCall.post<LoginResponse>(
          "/google/callback",
          {
            code: codeResponse.code,
          },
        );
        logIn({ accessToken: data.data.accessToken, role: data.data.role });
      });
    },
    onError: () => setError("Google login failed"),
  });

  const logout = async (): Promise<void> => {
    try {
      // Backend must clear the httpOnly refreshToken cookie
      await axiosCall.post("/logout");
    } catch {
      // even if this fails, still log out locally
    } finally {
      clearAuth();
      window.location.href = "/login";
    }
  };

  const registerRequest = (
    name: string,
    email: string,
    password: string,
  ): Promise<RegisterResponse | null> =>
    run(async () => {
      const credentials: RegisterCredentials = { name, email, password };
      const { data } = await axiosCall.post<RegisterResponse>(
        "/register",
        credentials,
      );
      alert("OTP Sent for verification");
      return data;
    });

  const verifyRegister = async (
    email: string,
    otp: string,
  ): Promise<boolean> => {
    const credentials: RegisterOTPCredentials = { email, otp };
    const result = await run(async () => {
      const { data } = await axiosCall.post<VerifyRegisterResponse>(
        "/verifyEmail",
        credentials,
      );
      logIn({ accessToken: data.accessToken, role: data.role });
      return true;
    });
    if (result) alert("Registration successful!");
    return result ?? false;
  };

  return {
    login,
    logout,
    registerRequest,
    verifyRegister,
    handleGoogleSignIn,
    loading,
    error,
  };
}
