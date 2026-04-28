import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProfitabilityService } from './profitability.service';

@Controller('profitability')
export class ProfitabilityController {
  constructor(private readonly profitabilityService: ProfitabilityService) {}

  /**
   * GET /api/profitability/trips/:id/profit
   * Get trip profit details
   */
  @Get('trips/:id/profit')
  async getTripProfit(@Param('id', ParseIntPipe) id: number) {
    return await this.profitabilityService.getTripProfit(id);
  }

  /**
   * GET /api/profitability/trips/:id/margin
   * Get trip margin
   */
  @Get('trips/:id/margin')
  async getTripMargin(@Param('id', ParseIntPipe) id: number) {
    return await this.profitabilityService.getTripMargin(id);
  }

  /**
   * POST /api/profitability/trips/:id/calculate
   * Calculate and update trip profitability
   */
  @Post('trips/:id/calculate')
  async calculateTripProfitability(@Param('id', ParseIntPipe) id: number) {
    return await this.profitabilityService.calculateTripProfitability(id);
  }

  /**
   * GET /api/profitability/customers
   * Get all customers profitability
   */
  @Get('customers')
  async getAllCustomersProfitability(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getAllCustomersProfitability(start, end);
  }

  /**
   * GET /api/profitability/customers/:name
   * Get customer profitability
   */
  @Get('customers/:name')
  async getCustomerProfitability(
    @Param('name') name: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getCustomerProfitability(name, start, end);
  }

  /**
   * GET /api/profitability/routes
   * Get all routes profitability
   */
  @Get('routes')
  async getAllRoutesProfitability(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getAllRoutesProfitability(start, end);
  }

  /**
   * GET /api/profitability/routes/:name
   * Get route profitability
   */
  @Get('routes/:name')
  async getRouteProfitability(
    @Param('name') name: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getRouteProfitability(name, start, end);
  }

  /**
   * GET /api/profitability/fleet
   * Get fleet profitability dashboard
   */
  @Get('fleet')
  async getFleetProfitability(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getFleetProfitability(start, end);
  }

  /**
   * GET /api/profitability/fleet/insights
   * Get fleet insights with top performers and opportunities
   */
  @Get('fleet/insights')
  async getFleetInsights(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.getFleetInsights(start, end);
  }

  /**
   * POST /api/profitability/bulk-calculate
   * Bulk calculate profitability for all trips
   */
  @Post('bulk-calculate')
  async bulkCalculateProfitability(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.profitabilityService.bulkCalculateProfitability(start, end);
  }
}
