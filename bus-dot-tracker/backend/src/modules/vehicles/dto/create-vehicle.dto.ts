import { IsString, IsInt, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  name: string;

  @IsString()
  @IsIn(['motorcoach', 'minibus', 'van', 'sedan', 'suv'])
  type: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsOptional()
  plate_number?: string;

  @IsString()
  @IsOptional()
  make_model?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsBoolean()
  @IsOptional()
  wheelchair_accessible?: boolean;

  @IsInt()
  @IsOptional()
  luggage_bays?: number;

  @IsOptional()
  last_inspection_date?: Date;

  @IsInt()
  @IsOptional()
  @Min(0)
  current_mileage?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
