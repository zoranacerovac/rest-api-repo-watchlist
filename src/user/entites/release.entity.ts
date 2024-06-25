import { IsNotEmpty } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Release {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  repoID: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
