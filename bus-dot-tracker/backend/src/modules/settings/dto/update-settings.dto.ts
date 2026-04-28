import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  hos_11_hour_limit_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  hos_14_hour_limit_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  hos_60_70_hour_limit_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  pre_trip_default_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  post_trip_default_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  break_duration_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  break_required_after_minutes?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  restart_hours_minutes?: number;
}
