import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { refreshToken } from "@/lib/authService";

let accessToken: string | null = localStorage.getItem("access_token");

/**
 * Updates the in-memory and persisted access token.
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Attach Bearer token on each request
api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 responses: attempt one refresh then retry original
api.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError & { config: AxiosRequestConfig & { _retry?: boolean } }
  ) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;
      try {
        const { access_token } = await refreshToken();
        setAccessToken(access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (_err) {
        setAccessToken(null);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
