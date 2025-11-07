import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarPagoDto {
  @ApiProperty({
    example: 5000.0,
    description: 'Monto del pago recibido',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  montoPago: number;
}
