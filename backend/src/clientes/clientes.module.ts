import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { AuthModule } from '../auth/auth.module';
import { Cliente } from './entities/clientes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente]), AuthModule],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}