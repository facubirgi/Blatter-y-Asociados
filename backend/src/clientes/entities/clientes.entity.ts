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