import { IsString, IsEmail, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['off_duty', 'on_duty', 'driving', 'sleeper_berth'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['full_time', 'part_time'])
  employment_type?: string;

  @IsString()
  @IsOptional()
  license_number?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['70_8', '60_7'])
  hos_mode?: string;
}
