import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, IsIn, Min, IsDateString } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsOptional()
  external_reference?: string;

  @IsString()
  passenger_name: string;

  @IsInt()
  @IsOptional()
  group_size?: number;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  pickup_location: string;

  @IsString()
  dropoff_location: string;

  @IsDateString()
  pickup_time: Date;

  @IsDateString()
  dropoff_time: Date;

  @IsNumber()
  @Min(0.1)
  estimated_mileage: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  average_speed?: number;

  @IsInt()
  @IsOptional()
  pre_trip_minutes?: number;

  @IsInt()
  @IsOptional()
  post_trip_minutes?: number;

  @IsInt()
  @IsOptional()
  stop_minutes?: number;

  @IsInt()
  @IsOptional()
  dump_fuel_clean_minutes?: number;

  @IsNumber()
  @IsOptional()
  deadhead_miles?: number;

  @IsNumber()
  @IsOptional()
  deadhead_speed?: number;

  @IsBoolean()
  @IsOptional()
  relay_required?: boolean;

  @IsString()
  @IsOptional()
  relay_location?: string;

  @IsBoolean()
  @IsOptional()
  hotel_reset_required?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsNumber()
  @IsOptional()
  revenue?: number;

  @IsString()
  @IsOptional()
  @IsIn(['contract', 'retail'])
  trip_type?: string;

  @IsInt()
  @IsOptional()
  driver_id?: number;

  @IsInt()
  @IsOptional()
  vehicle_id?: number;
}
