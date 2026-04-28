import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip } from '../../entities/trip.entity';

export interface TripProfit {
  tripId: number;
  tripRevenue: number;
  tripCost: number;
  tripProfit: number;
  tripMargin: number;
  customerName?: string;
  routeName?: string;
}

export interface CustomerProfitability {
  customerName: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  tripCount: number;
  lifetimeValue: number;
}

export interface RouteProfitability {
  route_id?: number;
  routeName: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  margin: number;
  avg_deadhead: number;
  avg_mpg: number;
  tripCount: number;
  efficiency: number;
  risk_level: string;
  recommendations: string[];
}

export interface FleetProfitability {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  fleetMargin: number;
  tripCount: number;
  avgRevenuePerTrip: number;
  avgCostPerTrip: number;
  avgProfitPerTrip: number;
}

export interface FleetInsights {
  top_route: string;
  highest_margin: string;
  lowest_margin: string;
  pricing_opportunities: number;
  efficiency_opportunities: number;
}

@Injectable()
export class ProfitabilityService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  /**
   * Calculate and update trip profitability metrics
   */
  async calculateTripProfitability(tripId: number): Promise<TripProfit> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId },
      relations: ['driver', 'vehicle'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Calculate profit and margin
    const tripRevenue = trip.trip_revenue || 0;
    const tripCost = trip.trip_cost || 0;
    const tripProfit = tripRevenue - tripCost;
    const tripMargin = tripRevenue > 0 ? tripProfit / tripRevenue : 0;

    // Calculate efficiency score
    const efficiencyScore = this.calculateEfficiency(
      trip.mpg_score || 0,
      trip.deadhead_score || 0,
      trip.driver_cost_score || 0,
    );

    // Calculate risk score
    const riskScore = this.calculateRisk(
      trip.weather_risk || 0,
      trip.traffic_risk || 0,
      trip.breakdown_risk || 0,
    );

    // Update the trip with calculated values
    trip.trip_profit = tripProfit;
    trip.trip_margin = tripMargin;
    trip.efficiency_score = efficiencyScore;
    trip.risk_score = riskScore;

    await this.tripsRepository.save(trip);

    return {
      tripId: trip.id,
      tripRevenue,
      tripCost,
      tripProfit,
      tripMargin,
      customerName: trip.customer_name,
      routeName: trip.route_name,
    };
  }

  /**
   * Calculate efficiency score from component scores
   * Formula: efficiency = (mpg_score + deadhead_score + driver_cost_score) / 3
   */
  private calculateEfficiency(
    mpgScore: number,
    deadheadScore: number,
    driverCostScore: number,
  ): number {
    return (mpgScore + deadheadScore + driverCostScore) / 3;
  }

  /**
   * Calculate risk score from component scores
   * Formula: risk = (weather_risk + traffic_risk + breakdown_risk) / 3
   */
  private calculateRisk(
    weatherRisk: number,
    trafficRisk: number,
    breakdownRisk: number,
  ): number {
    return (weatherRisk + trafficRisk + breakdownRisk) / 3;
  }

  /**
   * Get trip profitability details
   */
  async getTripProfit(tripId: number): Promise<TripProfit> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return {
      tripId: trip.id,
      tripRevenue: trip.trip_revenue || 0,
      tripCost: trip.trip_cost || 0,
      tripProfit: trip.trip_profit || 0,
      tripMargin: trip.trip_margin || 0,
      customerName: trip.customer_name,
      routeName: trip.route_name,
    };
  }

  /**
   * Get trip margin
   */
  async getTripMargin(tripId: number): Promise<{ tripId: number; margin: number }> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return {
      tripId: trip.id,
      margin: trip.trip_margin || 0,
    };
  }

  /**
   * Calculate customer profitability
   */
  async getCustomerProfitability(customerName: string, startDate?: Date, endDate?: Date): Promise<CustomerProfitability> {
    const whereClause: any = { customer_name: customerName };

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    if (trips.length === 0) {
      throw new NotFoundException(`No trips found for customer: ${customerName}`);
    }

    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.trip_revenue || 0), 0);
    const totalCost = trips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const averageMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

    return {
      customerName,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin,
      tripCount: trips.length,
      lifetimeValue: totalProfit,
    };
  }

  /**
   * Get all customers profitability
   */
  async getAllCustomersProfitability(startDate?: Date, endDate?: Date): Promise<CustomerProfitability[]> {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    // Group by customer
    const customerMap = new Map<string, Trip[]>();
    trips.forEach(trip => {
      if (trip.customer_name) {
        if (!customerMap.has(trip.customer_name)) {
          customerMap.set(trip.customer_name, []);
        }
        customerMap.get(trip.customer_name)!.push(trip);
      }
    });

    const results: CustomerProfitability[] = [];
    for (const [customerName, customerTrips] of customerMap.entries()) {
      const totalRevenue = customerTrips.reduce((sum, trip) => sum + (trip.trip_revenue || 0), 0);
      const totalCost = customerTrips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
      const totalProfit = totalRevenue - totalCost;
      const averageMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

      results.push({
        customerName,
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin,
        tripCount: customerTrips.length,
        lifetimeValue: totalProfit,
      });
    }

    // Sort by profit descending
    return results.sort((a, b) => b.totalProfit - a.totalProfit);
  }

  /**
   * Calculate route profitability
   */
  async getRouteProfitability(routeName: string, startDate?: Date, endDate?: Date): Promise<RouteProfitability> {
    const whereClause: any = { route_name: routeName };

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    if (trips.length === 0) {
      throw new NotFoundException(`No trips found for route: ${routeName}`);
    }

    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.trip_revenue || 0), 0);
    const totalCost = trips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
    const efficiency = totalCost > 0 ? totalRevenue / totalCost : 0;
    
    // Calculate averages
    const avgDeadhead = trips.reduce((sum, trip) => sum + (trip.deadhead_miles || 0), 0) / trips.length;
    const avgMpg = trips.reduce((sum, trip) => sum + (trip.mpg_score || 0), 0) / trips.length;
    const avgRisk = trips.reduce((sum, trip) => sum + (trip.risk_score || 0), 0) / trips.length;

    // Determine risk level
    const riskLevel = this.getRiskLevel(avgRisk);

    // Generate recommendations
    const recommendations = this.generateRouteRecommendations(margin, avgDeadhead, avgMpg, avgRisk);

    return {
      routeName,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      total_profit: totalProfit,
      margin,
      avg_deadhead: avgDeadhead,
      avg_mpg: avgMpg,
      tripCount: trips.length,
      efficiency,
      risk_level: riskLevel,
      recommendations,
    };
  }

  /**
   * Get risk level classification from risk score
   */
  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate route optimization recommendations
   */
  private generateRouteRecommendations(
    margin: number,
    avgDeadhead: number,
    avgMpg: number,
    avgRisk: number,
  ): string[] {
    const recommendations: string[] = [];

    // Pricing recommendations
    if (margin < 0.15) {
      const increaseNeeded = ((0.20 - margin) * 100).toFixed(0);
      recommendations.push(`Increase pricing by ${increaseNeeded}%`);
    } else if (margin < 0.25) {
      const increaseNeeded = ((0.25 - margin) * 100).toFixed(0);
      recommendations.push(`Consider increasing pricing by ${increaseNeeded}%`);
    }

    // MPG recommendations
    if (avgMpg < 6.0) {
      recommendations.push('Assign higher-MPG vehicles');
    } else if (avgMpg < 5.5) {
      recommendations.push('Critical: Replace with fuel-efficient vehicles');
    }

    // Deadhead recommendations
    if (avgDeadhead > 20) {
      recommendations.push('Reduce deadhead by repositioning vehicle');
    } else if (avgDeadhead > 25) {
      recommendations.push('Critical: Review depot locations to reduce deadhead');
    }

    // Risk recommendations
    if (avgRisk >= 70) {
      recommendations.push('High risk: Implement additional safety protocols');
    } else if (avgRisk >= 50) {
      recommendations.push('Avoid peak traffic window between 4–6 PM');
    }

    // Margin excellence
    if (margin >= 0.35) {
      recommendations.push('Excellent margin - maintain current pricing and operations');
    }

    return recommendations;
  }

  /**
   * Get all routes profitability
   */
  async getAllRoutesProfitability(startDate?: Date, endDate?: Date): Promise<RouteProfitability[]> {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    // Group by route
    const routeMap = new Map<string, Trip[]>();
    trips.forEach(trip => {
      if (trip.route_name) {
        if (!routeMap.has(trip.route_name)) {
          routeMap.set(trip.route_name, []);
        }
        routeMap.get(trip.route_name)!.push(trip);
      }
    });

    const results: RouteProfitability[] = [];
    for (const [routeName, routeTrips] of routeMap.entries()) {
      const totalRevenue = routeTrips.reduce((sum, trip) => sum + (trip.trip_revenue || 0), 0);
      const totalCost = routeTrips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
      const totalProfit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
      const efficiency = totalCost > 0 ? totalRevenue / totalCost : 0;
      
      // Calculate averages
      const avgDeadhead = routeTrips.reduce((sum, trip) => sum + (trip.deadhead_miles || 0), 0) / routeTrips.length;
      const avgMpg = routeTrips.reduce((sum, trip) => sum + (trip.mpg_score || 0), 0) / routeTrips.length;
      const avgRisk = routeTrips.reduce((sum, trip) => sum + (trip.risk_score || 0), 0) / routeTrips.length;

      // Determine risk level
      const riskLevel = this.getRiskLevel(avgRisk);

      // Generate recommendations
      const recommendations = this.generateRouteRecommendations(margin, avgDeadhead, avgMpg, avgRisk);

      results.push({
        routeName,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        margin,
        avg_deadhead: avgDeadhead,
        avg_mpg: avgMpg,
        tripCount: routeTrips.length,
        efficiency,
        risk_level: riskLevel,
        recommendations,
      });
    }

    // Sort by margin descending
    return results.sort((a, b) => b.margin - a.margin);
  }

  /**
   * Calculate fleet profitability
   */
  async getFleetProfitability(startDate?: Date, endDate?: Date): Promise<FleetProfitability> {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.trip_revenue || 0), 0);
    const totalCost = trips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const fleetMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
    const tripCount = trips.length;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      fleetMargin,
      tripCount,
      avgRevenuePerTrip: tripCount > 0 ? totalRevenue / tripCount : 0,
      avgCostPerTrip: tripCount > 0 ? totalCost / tripCount : 0,
      avgProfitPerTrip: tripCount > 0 ? totalProfit / tripCount : 0,
    };
  }

  /**
   * Get fleet insights with top performers and opportunities
   */
  async getFleetInsights(startDate?: Date, endDate?: Date): Promise<FleetInsights> {
    const routes = await this.getAllRoutesProfitability(startDate, endDate);

    if (routes.length === 0) {
      return {
        top_route: 'N/A',
        highest_margin: 'N/A',
        lowest_margin: 'N/A',
        pricing_opportunities: 0,
        efficiency_opportunities: 0,
      };
    }

    // Find top revenue route
    const topRoute = routes.reduce((prev, current) =>
      current.total_revenue > prev.total_revenue ? current : prev
    );

    // Find highest margin route
    const highestMargin = routes.reduce((prev, current) =>
      current.margin > prev.margin ? current : prev
    );

    // Find lowest margin route
    const lowestMargin = routes.reduce((prev, current) =>
      current.margin < prev.margin ? current : prev
    );

    // Count pricing opportunities (routes with margin < 25%)
    const pricingOpportunities = routes.filter(r => r.margin < 0.25).length;

    // Count efficiency opportunities (routes with avg_mpg < 6.0 or avg_deadhead > 20)
    const efficiencyOpportunities = routes.filter(
      r => r.avg_mpg < 6.0 || r.avg_deadhead > 20
    ).length;

    return {
      top_route: topRoute.routeName,
      highest_margin: highestMargin.routeName,
      lowest_margin: lowestMargin.routeName,
      pricing_opportunities: pricingOpportunities,
      efficiency_opportunities: efficiencyOpportunities,
    };
  }

  /**
   * Bulk update trip profitability for all trips
   */
  async bulkCalculateProfitability(startDate?: Date, endDate?: Date): Promise<{ updated: number }> {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.pickup_time = Between(startDate, endDate);
    }

    const trips = await this.tripsRepository.find({
      where: whereClause,
    });

    let updated = 0;
    for (const trip of trips) {
      const tripRevenue = trip.trip_revenue || 0;
      const tripCost = trip.trip_cost || 0;
      const tripProfit = tripRevenue - tripCost;
      const tripMargin = tripRevenue > 0 ? tripProfit / tripRevenue : 0;

      trip.trip_profit = tripProfit;
      trip.trip_margin = tripMargin;

      await this.tripsRepository.save(trip);
      updated++;
    }

    return { updated };
  }
}
