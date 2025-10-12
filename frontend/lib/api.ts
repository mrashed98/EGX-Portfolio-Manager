import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Helper to check if token is expiring soon
function isTokenExpiringSoon(): boolean {
  const expiresAt = localStorage.getItem("token_expires_at");
  if (!expiresAt) return true;
  
  const expirationTime = parseInt(expiresAt, 10);
  const now = Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return expirationTime - now < fiveMinutesInMs;
}

// Helper to refresh token
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(`${API_URL}/api/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
    
    // Update stored tokens
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", new_refresh_token);
    localStorage.setItem("token_expires_at", String(Date.now() + expires_in * 1000));
    
    return access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    // Clear tokens and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    window.location.href = "/login";
    return null;
  }
}

// Add request interceptor - check token expiration and refresh if needed
api.interceptors.request.use(
  async (config) => {
    // Skip token check for auth endpoints
    if (config.url?.includes("/auth/")) {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      // Check if token is expiring soon
      if (isTokenExpiringSoon() && !isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            
            // Notify all waiting requests
            refreshSubscribers.forEach((callback) => callback(newToken));
            refreshSubscribers = [];
          }
        } finally {
          isRefreshing = false;
        }
      } else if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken: string) => {
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
          });
        });
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors by attempting token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retried and not a refresh request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

