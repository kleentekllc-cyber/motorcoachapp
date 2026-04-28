import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity('pay_structures')
export class PayStructure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  driver_id: number;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'varchar', length: 50 })
  employment_type: string; // full_time, part_time

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicle_type: string; // sedan_suv, van_motorcoach, half_day, full_day

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  base_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gratuity_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  safety_bonus_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  weekly_salary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  flat_half_day_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  flat_full_day_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
