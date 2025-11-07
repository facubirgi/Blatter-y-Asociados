import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // Excluir password de las respuestas JSON
  password: string;

  @Column()
  nombre: string;

  @Column({ nullable: true, name: 'foto_perfil' })
  fotoPerfil: string; // Base64 string de la imagen

  @Column({ default: 'contador' })
  rol: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación con clientes (la implementaremos después)
  // @OneToMany(() => Cliente, (cliente) => cliente.usuario)
  // clientes: Cliente[];

  // Relación con operaciones (la implementaremos después)
  // @OneToMany(() => Operacion, (operacion) => operacion.usuario)
  // operaciones: Operacion[];
}