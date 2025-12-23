import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerarMensualesDto {
  @ApiProperty({
    example: 1,
    description: 'Día para generar las mensualidades (1-31)',
    required: false,
    minimum: 1,
    maximum: 31,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El día debe ser un número' })
  @IsOptional()
  @Min(1, { message: 'El día debe ser entre 1 y 31' })
  @Max(31, { message: 'El día debe ser entre 1 y 31' })
  dia?: number;

  @ApiProperty({
    example: 12,
    description: 'Mes para generar las mensualidades (1-12)',
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El mes debe ser un número' })
  @IsOptional()
  @Min(1, { message: 'El mes debe ser entre 1 y 12' })
  @Max(12, { message: 'El mes debe ser entre 1 y 12' })
  mes?: number;

  @ApiProperty({
    example: 2025,
    description: 'Año para generar las mensualidades',
    required: false,
    minimum: 2020,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El año debe ser un número' })
  @IsOptional()
  @Min(2020, { message: 'El año debe ser mayor o igual a 2020' })
  anio?: number;
}
