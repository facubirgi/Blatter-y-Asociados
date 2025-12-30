import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum CondicionFiscal {
  RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
  MONOTRIBUTISTA = 'MONOTRIBUTISTA',
}

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  cuit: string;

  @Column({ name: 'fecha_alta', type: 'date' })
  fechaAlta: Date;

  @Column()
  contacto: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'es_cliente_fijo', type: 'boolean', default: false })
  esClienteFijo: boolean;

  @Column({
    name: 'monto_mensualidad',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  montoMensualidad: number;

  @Column({
    name: 'condicion_fiscal',
    type: 'enum',
    enum: CondicionFiscal,
    default: CondicionFiscal.RESPONSABLE_INSCRIPTO,
  })
  condicionFiscal: CondicionFiscal;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación con Usuario
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  usuario: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Relación con Operaciones (la implementaremos después)
  // @OneToMany(() => Operacion, (operacion) => operacion.cliente)
  // operaciones: Operacion[];
}
