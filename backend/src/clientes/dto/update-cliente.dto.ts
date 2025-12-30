import { PartialType } from '@nestjs/swagger';
import { CreateClienteDto } from './create-cliente.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo/inactivo del cliente',
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
