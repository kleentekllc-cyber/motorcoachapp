import { Controller, Post, Get, Body } from '@nestjs/common';
import { PayService } from './pay.service';
import { CalculatePayDto } from './dto/calculate-pay.dto';

@Controller('api/pay')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Post('calculate')
  calculate(@Body() calculatePayDto: CalculatePayDto) {
    return this.payService.calculateForTrip(calculatePayDto);
  }

  @Get('structures')
  getStructures() {
    return this.payService.getPayStructures();
  }

  @Get('bonus-rules')
  getBonusRules() {
    return this.payService.getBonusRules();
  }
}
