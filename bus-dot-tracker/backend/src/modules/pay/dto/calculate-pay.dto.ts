import { IsInt, IsNumber, IsString, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';

export class CalculatePayDto {
  @IsInt()
  @IsOptional()
  driver_id?: number;

  @IsInt()
  @IsOptional()
  trip_id?: number;

  @IsNumber()
  @Min(0)
  revenue: number;

  @IsString()
  @IsIn(['contract', 'retail'])
  trip_type: string;

  @IsString()
  @IsIn(['full_time', 'part_time'])
  driver_type: string;

  @IsString()
  @IsOptional()
  @IsIn(['sedan_suv', 'van_motorcoach', 'half_day', 'full_day'])
  vehicle_type?: string;

  @IsBoolean()
  @IsOptional()
  includes_deadhead?: boolean;

  @IsNumber()
  @IsOptional()
  deadhead_duration_hours?: number;

  @IsBoolean()
  @IsOptional()
  includes_relay?: boolean;

  @IsNumber()
  @IsOptional()
  relay_duration_hours?: number;

  @IsBoolean()
  @IsOptional()
  is_safety_eligible?: boolean;
}
