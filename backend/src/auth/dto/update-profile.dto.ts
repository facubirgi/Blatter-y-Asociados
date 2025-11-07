import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre del usuario',
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    description: 'Foto de perfil en formato base64',
  })
  @IsString({ message: 'La foto de perfil debe ser un texto válido (base64)' })
  @IsOptional()
  fotoPerfil?: string;
}
