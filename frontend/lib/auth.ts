import api from "./api";

export interface User {
  id: number;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await api.post<TokenResponse>("/auth/login", credentials);
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Store tokens and expiration
    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("token_expires_at", String(Date.now() + expires_in * 1000));
    
    return access_token;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return null;
      }

      const response = await api.post<TokenResponse>("/auth/refresh", {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
      
      // Update stored tokens
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", new_refresh_token);
      localStorage.setItem("token_expires_at", String(Date.now() + expires_in * 1000));
      
      return access_token;
    } catch (error) {
      // If refresh fails, log user out
      console.error("Failed to refresh token:", error);
      this.logout();
      return null;
    }
  },

  isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;
    
    const expirationTime = parseInt(expiresAt, 10);
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    // Return true if token expires in less than 5 minutes
    return expirationTime - now < fiveMinutesInMs;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },
};

