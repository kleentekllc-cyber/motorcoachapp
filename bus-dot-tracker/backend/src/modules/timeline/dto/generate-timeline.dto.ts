import { IsInt } from 'class-validator';

export class GenerateTimelineDto {
  @IsInt()
  trip_id: number;
}
