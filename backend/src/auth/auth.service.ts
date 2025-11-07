import {
    ConflictException,
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, nombre } = registerDto;

        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('El email ya está registrado');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            nombre,
        });

        await this.userRepository.save(user);

        // Generar token
        const token = this.generateToken(user);

        // Remover password de la respuesta
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Buscar usuario por email
        const user = await this.userRepository.findOne({
            where: { email, activo: true },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generar token
        const token = this.generateToken(user);

        // Remover password de la respuesta
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token,
        };
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Actualizar campos si están presentes
        if (updateProfileDto.nombre !== undefined) {
            user.nombre = updateProfileDto.nombre;
        }

        if (updateProfileDto.fotoPerfil !== undefined) {
            user.fotoPerfil = updateProfileDto.fotoPerfil;
        }

        await this.userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    private generateToken(user: User): string {
        const payload = { id: user.id, email: user.email };
        return this.jwtService.sign(payload);
    }
}