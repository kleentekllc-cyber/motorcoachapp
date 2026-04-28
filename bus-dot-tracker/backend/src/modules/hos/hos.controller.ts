import { Controller, Post, Body } from '@nestjs/common';
import { HosService } from './hos.service';
import { CalculateHosDto } from './dto/calculate-hos.dto';

@Controller('api/hos')
export class HosController {
  constructor(private readonly hosService: HosService) {}

  @Post('calculate')
  calculate(@Body() calculateHosDto: CalculateHosDto) {
    return this.hosService.calculateForTrip(calculateHosDto);
  }
}
