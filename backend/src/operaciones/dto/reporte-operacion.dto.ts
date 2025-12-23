import { ApiProperty } from '@nestjs/swagger';

export class ReporteOperacionDto {
  @ApiProperty({ description: 'ID de la operación' })
  id: string;

  @ApiProperty({ description: 'Nombre del cliente' })
  clienteNombre: string;

  @ApiProperty({ description: 'Fecha de completado (YYYY-MM-DD)' })
  fechaCompletado: string;

  @ApiProperty({ description: 'Monto total pagado' })
  montoTotal: number;
}
