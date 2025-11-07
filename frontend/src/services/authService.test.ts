import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService, type User, type RegisterData, type LoginData, type AuthResponse } from './authService';
import { api } from './api';

// Mock del módulo api
vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('authService', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    nombre: 'Usuario Test',
    rol: 'usuario',
    activo: true,
    fotoPerfil: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    token: 'mock-jwt-token',
  };

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        nombre: 'Nuevo Usuario',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', registerData);
      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('debe lanzar error si el registro falla', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'Password123!',
        nombre: 'Usuario',
      };

      vi.mocked(api.post).mockRejectedValue(new Error('Email ya registrado'));

      await expect(authService.register(registerData)).rejects.toThrow('Email ya registrado');
    });
  });

  describe('login', () => {
    it('debe autenticar un usuario exitosamente', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.login(loginData);

      expect(api.post).toHaveBeenCalledWith('/api/auth/login', loginData);
      expect(result).toEqual(mockAuthResponse);
    });

    it('debe lanzar error si las credenciales son incorrectas', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      vi.mocked(api.post).mockRejectedValue(new Error('Credenciales inválidas'));

      await expect(authService.login(loginData)).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('getProfile', () => {
    it('debe obtener el perfil del usuario autenticado', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/api/auth/profile');
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar error si no está autenticado', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('No autorizado'));

      await expect(authService.getProfile()).rejects.toThrow('No autorizado');
    });
  });

  describe('updateProfile', () => {
    it('debe actualizar el perfil del usuario', async () => {
      const updateData = {
        nombre: 'Nombre Actualizado',
        fotoPerfil: 'data:image/png;base64,abc123',
      };

      const updatedUser = { ...mockUser, ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedUser });

      const result = await authService.updateProfile(updateData);

      expect(api.patch).toHaveBeenCalledWith('/api/auth/profile', updateData);
      expect(result.nombre).toBe(updateData.nombre);
      expect(result.fotoPerfil).toBe(updateData.fotoPerfil);
    });

    it('debe actualizar solo el nombre', async () => {
      const updateData = { nombre: 'Solo Nombre' };
      const updatedUser = { ...mockUser, nombre: updateData.nombre };

      vi.mocked(api.patch).mockResolvedValue({ data: updatedUser });

      const result = await authService.updateProfile(updateData);

      expect(result.nombre).toBe(updateData.nombre);
    });
  });

  describe('logout', () => {
    it('debe eliminar token y usuario del localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getToken', () => {
    it('debe retornar el token si existe', () => {
      localStorage.setItem('token', 'mock-token');

      const token = authService.getToken();

      expect(token).toBe('mock-token');
    });

    it('debe retornar null si no hay token', () => {
      const token = authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getUser', () => {
    it('debe retornar el usuario si existe en localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authService.getUser();

      expect(user).toEqual(mockUser);
    });

    it('debe retornar null si no hay usuario', () => {
      const user = authService.getUser();

      expect(user).toBeNull();
    });

    it('debe parsear correctamente el JSON del usuario', () => {
      const userString = JSON.stringify(mockUser);
      localStorage.setItem('user', userString);

      const user = authService.getUser();

      expect(user).toEqual(mockUser);
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('isAuthenticated', () => {
    it('debe retornar true si hay token', () => {
      localStorage.setItem('token', 'mock-token');

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('debe retornar false si no hay token', () => {
      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('debe retornar false si el token es string vacío', () => {
      localStorage.setItem('token', '');

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });
});
