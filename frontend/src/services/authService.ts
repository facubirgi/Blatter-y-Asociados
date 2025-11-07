import { api } from './api';

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  fotoPerfil?: string | null;
  rol: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  nombre?: string;
  fotoPerfil?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/api/auth/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.patch<User>('/api/auth/profile', data);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
