import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsUUID,
  IsOptional,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoOperacion, EstadoOperacion } from '../entities/operacion.entity';

export class CreateOperacionDto {
  @ApiProperty({
    enum: TipoOperacion,
    example: TipoOperacion.DECLARACION_IMPUESTOS,
    description: 'Tipo de operación',
  })
  @IsEnum(TipoOperacion, { message: 'Tipo de operación inválido' })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  tipo: TipoOperacion;

  @ApiProperty({
    example: 'Declaración jurada de IVA del mes de enero',
    description: 'Descripción de la operación (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    example: 15000.50,
    description: 'Monto de la operación',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0, { message: 'El monto no puede ser negativo' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  monto: number;

  @ApiProperty({
    example: '2024-02-15',
    description: 'Fecha límite de la operación (formato: YYYY-MM-DD) (opcional)',
    required: false,
  })
  @IsDateString(
    {},
    { message: 'La fecha límite debe ser una fecha válida (YYYY-MM-DD)' },
  )
  @IsOptional()
  fechaLimite?: string;

  @ApiProperty({
    example: '2024-02-01',
    description: 'Fecha de inicio de la operación (formato: YYYY-MM-DD)',
  })
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fechaInicio: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del cliente asociado',
  })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  clienteId: string;

  @ApiProperty({
    enum: EstadoOperacion,
    example: EstadoOperacion.PENDIENTE,
    description: 'Estado de la operación',
  })
  @IsEnum(EstadoOperacion, { message: 'Estado de operación inválido' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: EstadoOperacion;

  @ApiProperty({
    example: 'El cliente solicitó una revisión adicional',
    description: 'Notas adicionales (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  notas?: string;
}