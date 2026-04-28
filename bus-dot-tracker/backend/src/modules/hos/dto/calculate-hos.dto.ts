import { IsInt, IsNumber, IsOptional, IsIn, Min, IsString } from 'class-validator';

export class CalculateHosDto {
  @IsInt()
  @IsOptional()
  trip_id?: number;

  @IsInt()
  @IsOptional()
  driver_id?: number;

  // Or provide full trip data
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  miles?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  avg_speed_mph?: number;

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
  service_task_minutes?: number;

  @IsNumber()
  @IsOptional()
  deadhead_miles?: number;

  @IsNumber()
  @IsOptional()
  deadhead_speed_mph?: number;

  @IsNumber()
  @IsOptional()
  weekly_hours_used?: number;

  @IsString()
  @IsOptional()
  @IsIn(['70_8', '60_7'])
  hos_mode?: string;
}
