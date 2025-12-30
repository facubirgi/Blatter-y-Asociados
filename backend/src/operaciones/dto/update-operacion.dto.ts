import { PartialType } from '@nestjs/swagger';
import { CreateOperacionDto } from './create-operacion.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { EstadoOperacion } from '../entities/operacion.entity';

export class UpdateOperacionDto extends PartialType(CreateOperacionDto) {
  @ApiPropertyOptional({
    enum: EstadoOperacion,
    example: EstadoOperacion.EN_PROCESO,
    description: 'Estado de la operación',
  })
  @IsEnum(EstadoOperacion, { message: 'Estado inválido' })
  @IsOptional()
  estado?: EstadoOperacion;

  @ApiPropertyOptional({
    example: '2024-02-10',
    description: 'Fecha de completado (formato: YYYY-MM-DD)',
  })
  @IsDateString(
    {},
    {
      message: 'La fecha de completado debe ser una fecha válida (YYYY-MM-DD)',
    },
  )
  @IsOptional()
  fechaCompletado?: string;

  @ApiPropertyOptional({
    example: 5000.0,
    description: 'Monto pagado parcialmente',
  })
  @IsNumber({}, { message: 'El monto pagado debe ser un número válido' })
  @Min(0, { message: 'El monto pagado no puede ser negativo' })
  @IsOptional()
  montoPagado?: number;
}
