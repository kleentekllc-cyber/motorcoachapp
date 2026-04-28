import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // motorcoach, minibus, van, sedan, suv

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plate_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  make_model: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'boolean', default: false })
  wheelchair_accessible: boolean;

  @Column({ type: 'int', default: 0 })
  luggage_bays: number;

  @Column({ type: 'date', nullable: true })
  last_inspection_date: Date;

  @Column({ type: 'int', default: 0 })
  current_mileage: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
