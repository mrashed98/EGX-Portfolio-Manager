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

export const authService = {
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await api.post("/auth/login", credentials);
    const token = response.data.access_token;
    localStorage.setItem("token", token);
    return token;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },
};

