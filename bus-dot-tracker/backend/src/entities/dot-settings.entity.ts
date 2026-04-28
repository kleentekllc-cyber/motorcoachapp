import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('dot_settings')
export class DotSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, default: 'Bus Company' })
  company_name: string;

  @Column({ type: 'int', default: 660 }) // 11 hours × 60 minutes
  hos_11_hour_limit_minutes: number;

  @Column({ type: 'int', default: 840 }) // 14 hours × 60 minutes
  hos_14_hour_limit_minutes: number;

  @Column({ type: 'int', default: 4200 }) // 70 hours × 60 minutes
  hos_60_70_hour_limit_minutes: number;

  @Column({ type: 'int', default: 15 })
  pre_trip_default_minutes: number;

  @Column({ type: 'int', default: 15 })
  post_trip_default_minutes: number;

  @Column({ type: 'int', default: 30 })
  break_duration_minutes: number;

  @Column({ type: 'int', default: 480 }) // 8 hours × 60 minutes
  break_required_after_minutes: number;

  @Column({ type: 'int', default: 2040 }) // 34 hours × 60 minutes
  restart_hours_minutes: number;

  @UpdateDateColumn()
  updated_at: Date;
}
