import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Cliente } from '../../clientes/entities/clientes.entity';

export enum TipoOperacion {
  DECLARACION_IMPUESTOS = 'DECLARACION_IMPUESTOS',
  CONTABILIDAD_MENSUAL = 'CONTABILIDAD_MENSUAL',
  ASESORIA = 'ASESORIA',
  LIQUIDACION_SUELDOS = 'LIQUIDACION_SUELDOS',
  OTRO = 'OTRO',
}

export enum EstadoOperacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADO = 'COMPLETADO',
}

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoOperacion,
  })
  tipo: TipoOperacion;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  // DEPRECADO - Mantener temporalmente para coexistencia (eliminar después de 1 semana)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  monto?: number;

  @Column({ name: 'ingresos_brutos', type: 'decimal', precision: 10, scale: 2, default: 0 })
  ingresosBrutos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  honorarios: number;

  @Column({ name: 'monto_total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'monto_pagado' })
  montoPagado: number;

  @Column({ name: 'es_mensualidad', type: 'boolean', default: false })
  esMensualidad: boolean;

  @Column({
    type: 'enum',
    enum: EstadoOperacion,
    default: EstadoOperacion.PENDIENTE,
  })
  estado: EstadoOperacion;

  @Column({ name: 'fecha_limite', type: 'date', nullable: true })
  fechaLimite: Date | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_completado', type: 'date', nullable: true })
  fechaCompletado: Date | null;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación con Cliente
  @ManyToOne(() => Cliente, { eager: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'cliente_id' })
  clienteId: string;

  // Relación con Usuario
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  usuario: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Hook para calcular montoTotal automáticamente (GARANTÍA DE INTEGRIDAD)
  @BeforeInsert()
  @BeforeUpdate()
  calcularMontoTotal() {
    this.montoTotal = Number(this.honorarios);
  }
}