import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Driver } from './driver.entity';
import { Vehicle } from './vehicle.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  external_reference: string;

  @Column({ type: 'varchar', length: 255 })
  passenger_name: string;

  @Column({ type: 'int', nullable: true })
  group_size: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_phone: string;

  @Column({ type: 'text' })
  pickup_location: string;

  @Column({ type: 'text' })
  dropoff_location: string;

  @Column({ type: 'timestamp' })
  pickup_time: Date;

  @Column({ type: 'timestamp' })
  dropoff_time: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  estimated_mileage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 55 })
  average_speed: number;

  @Column({ type: 'int', default: 15 })
  pre_trip_minutes: number;

  @Column({ type: 'int', default: 15 })
  post_trip_minutes: number;

  @Column({ type: 'int', default: 0 })
  stop_minutes: number;

  @Column({ type: 'int', default: 0 })
  dump_fuel_clean_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deadhead_miles: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
  deadhead_speed: number;

  @Column({ type: 'boolean', default: false })
  relay_required: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relay_location: string;

  @Column({ type: 'boolean', default: false })
  hotel_reset_required: boolean;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string; // scheduled, in_progress, completed, cancelled

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  legality_status: string; // pending, legal, warning, illegal

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number;

  @Column({ type: 'varchar', length: 50, default: 'contract' })
  trip_type: string; // contract, retail

  // Profitability Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  trip_revenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  trip_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  trip_profit: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  trip_margin: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route_name: string;

  // Efficiency Metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  mpg_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deadhead_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  driver_cost_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  efficiency_score: number;

  // Risk Metrics
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weather_risk: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  traffic_risk: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  breakdown_risk: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  risk_score: number;

  @Column({ type: 'int', nullable: true })
  driver_id: number;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'int', nullable: true })
  vehicle_id: number;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'jsonb', nullable: true })
  violations: any[];

  @Column({ type: 'jsonb', nullable: true })
  recommendations: any[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
