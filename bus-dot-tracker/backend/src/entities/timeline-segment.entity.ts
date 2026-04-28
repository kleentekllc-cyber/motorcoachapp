import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Trip } from './trip.entity';

@Entity('timeline_segments')
export class TimelineSegment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  trip_id: number;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'varchar', length: 50 })
  type: string; // drive, stop, deadhead, relay, hotel, pre_trip, post_trip, service

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'varchar', length: 50 })
  dot_status: string; // legal, warning, illegal

  @Column({ type: 'text', nullable: true })
  description: string;
}
