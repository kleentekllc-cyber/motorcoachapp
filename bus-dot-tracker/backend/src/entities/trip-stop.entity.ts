import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Trip } from './trip.entity';

@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  trip_id: number;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'text', nullable: true })
  location: string;
}
