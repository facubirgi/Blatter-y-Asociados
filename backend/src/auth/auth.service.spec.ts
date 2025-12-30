import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    nombre: 'Usuario Test',
    rol: 'usuario',
    activo: true,
    fotoPerfil: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    // Limpiar mocks
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      nombre: 'Nuevo Usuario',
    };

    it('debe registrar un nuevo usuario exitosamente', async () => {
      const hashedPassword = 'hashedPassword123';
      const token = 'jwt-token-123';

      mockUserRepository.findOne.mockResolvedValue(null); // Usuario no existe
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
        password: hashedPassword,
        nombre: registerDto.nombre,
      });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        password: hashedPassword,
        nombre: registerDto.nombre,
      });
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ email: registerDto.email }),
      );
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result.user).not.toHaveProperty('password'); // Password no debe estar en la respuesta
    });

    it('debe lanzar ConflictException si el email ya está registrado', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('debe hashear la contraseña correctamente', async () => {
      const hashedPassword = 'hashedPassword123';
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('debe autenticar un usuario exitosamente', async () => {
      const token = 'jwt-token-123';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, activo: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result.user).not.toHaveProperty('password');
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('no debe autenticar usuarios inactivos', async () => {
      const inactiveUser = { ...mockUser, activo: false };
      mockUserRepository.findOne.mockResolvedValue(null); // No encuentra usuario activo

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, activo: true },
      });
    });

    it('debe comparar contraseñas de forma segura', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });

  describe('getProfile', () => {
    it('debe retornar el perfil del usuario sin password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('nombre', mockUser.nombre);
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      nombre: 'Nombre Actualizado',
      fotoPerfil: 'data:image/png;base64,abc123',
    };

    it('debe actualizar el perfil del usuario', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.nombre).toBe(updateDto.nombre);
      expect(result.fotoPerfil).toBe(updateDto.fotoPerfil);
      expect(result).not.toHaveProperty('password');
    });

    it('debe actualizar solo el nombre si fotoPerfil no se proporciona', async () => {
      const updateDtoOnlyName = { nombre: 'Solo Nombre' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        nombre: updateDtoOnlyName.nombre,
      });

      const result = await service.updateProfile(
        mockUser.id,
        updateDtoOnlyName,
      );

      expect(result.nombre).toBe(updateDtoOnlyName.nombre);
    });

    it('debe actualizar solo la foto si nombre no se proporciona', async () => {
      const updateDtoOnlyPhoto = { fotoPerfil: 'data:image/png;base64,xyz' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        fotoPerfil: updateDtoOnlyPhoto.fotoPerfil,
      });

      const result = await service.updateProfile(
        mockUser.id,
        updateDtoOnlyPhoto,
      );

      expect(result.fotoPerfil).toBe(updateDtoOnlyPhoto.fotoPerfil);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateToken (private method)', () => {
    it('debe generar un token JWT con el payload correcto', async () => {
      const token = 'jwt-token-123';
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(token);

      await service.register({
        email: 'test@test.com',
        password: 'password',
        nombre: 'Test',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
