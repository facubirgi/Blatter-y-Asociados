import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  Matches,
  MinLength,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { CondicionFiscal } from '../entities/clientes.entity';

export class CreateClienteDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @ApiProperty({
    example: '20-12345678-9',
    description: 'CUIT del cliente (formato: XX-XXXXXXXX-X)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El CUIT es obligatorio' })
  @Matches(/^\d{2}-\d{8}-\d{1}$/, {
    message: 'El CUIT debe tener el formato XX-XXXXXXXX-X',
  })
  cuit: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Fecha de alta del cliente (formato: YYYY-MM-DD)',
  })
  @IsDateString(
    {},
    { message: 'La fecha de alta debe ser una fecha válida (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'La fecha de alta es obligatoria' })
  fechaAlta: string;

  @ApiProperty({
    example: 'juan.perez@gmail.com',
    description: 'Email o teléfono de contacto',
  })
  @IsString()
  @IsNotEmpty({ message: 'El contacto es obligatorio' })
  contacto: string;

  @ApiProperty({
    example: false,
    description: 'Indica si el cliente tiene mensualidad fija',
    required: false,
  })
  @IsBoolean({ message: 'esClienteFijo debe ser un booleano' })
  @IsOptional()
  esClienteFijo?: boolean;

  @ApiProperty({
    example: 50000,
    description: 'Monto de la mensualidad (solo si esClienteFijo es true)',
    required: false,
  })
  @IsNumber({}, { message: 'montoMensualidad debe ser un número' })
  @Min(0, { message: 'El monto de mensualidad debe ser mayor o igual a 0' })
  @IsOptional()
  montoMensualidad?: number;

  @ApiProperty({
    example: CondicionFiscal.RESPONSABLE_INSCRIPTO,
    description: 'Condición fiscal del cliente',
    enum: CondicionFiscal,
    required: false,
  })
  @IsEnum(CondicionFiscal, { message: 'Condición fiscal inválida' })
  @IsOptional()
  condicionFiscal?: CondicionFiscal;
}