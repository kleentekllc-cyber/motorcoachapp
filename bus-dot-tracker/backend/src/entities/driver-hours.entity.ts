import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_hours')
export class DriverHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  driver_id: number;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  on_duty_minutes: number;

  @Column({ type: 'int', default: 0 })
  driving_minutes: number;

  @Column({ type: 'int', default: 0 })
  off_duty_minutes: number;

  @Column({ type: 'varchar', length: 10, default: '70_8' })
  cycle_type: string; // 70_8 or 60_7

  @Column({ type: 'int', default: 0 })
  total_cycle_minutes: number;

  @CreateDateColumn()
  created_at: Date;
}
