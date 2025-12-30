import { ApiProperty } from '@nestjs/swagger';

export class MesEstadisticaDto {
  @ApiProperty({ description: 'Número de mes (1-12)' })
  mes: number;

  @ApiProperty({ description: 'Nombre del mes' })
  nombreMes: string;

  @ApiProperty({ description: 'Total de montos en el mes' })
  totalMonto: number;
}

export class EstadisticasAnualesDto {
  @ApiProperty({ description: 'Año de las estadísticas' })
  anio: number;

  @ApiProperty({ type: [MesEstadisticaDto], description: 'Array de 12 meses' })
  meses: MesEstadisticaDto[];
}
