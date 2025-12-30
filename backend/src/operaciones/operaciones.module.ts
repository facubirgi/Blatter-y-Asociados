import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { Operacion } from './entities/operacion.entity';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operacion, User]),
    AuthModule,
    ClientesModule,
  ],
  controllers: [OperacionesController],
  providers: [OperacionesService],
  exports: [OperacionesService],
})
export class OperacionesModule {}
