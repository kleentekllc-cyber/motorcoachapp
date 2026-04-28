import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, default: 'off_duty' })
  status: string; // off_duty, on_duty, driving, sleeper_berth

  @Column({ type: 'varchar', length: 50, default: 'full_time' })
  employment_type: string; // full_time, part_time

  @Column({ type: 'varchar', length: 100, nullable: true })
  license_number: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 50, default: '70_8' })
  hos_mode: string; // 70_8 or 60_7

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
