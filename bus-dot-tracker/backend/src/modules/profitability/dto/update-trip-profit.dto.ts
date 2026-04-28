import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateTripProfitDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  trip_revenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trip_cost?: number;
}
