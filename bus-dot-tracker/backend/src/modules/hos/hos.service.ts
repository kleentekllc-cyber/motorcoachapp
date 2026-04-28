import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { DriverHours } from '../../entities/driver-hours.entity';
import { SettingsService } from '../settings/settings.service';
import { CalculateHosDto } from './dto/calculate-hos.dto';

export interface HosCalculationResult {
  status: string;
  legality_status: string;
  driving_hours: number;
  on_duty_hours: number;
  remaining_driving: number;
  remaining_duty: number;
  remaining_weekly: number;
  break_required: boolean;
  violations: any[];
  recommendations: any[];
}

@Injectable()
export class HosService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(DriverHours)
    private driverHoursRepository: Repository<DriverHours>,
    private settingsService: SettingsService,
  ) {}

  async calculateForTrip(calculateHosDto: CalculateHosDto): Promise<HosCalculationResult> {
    const settings = await this.settingsService.getSettings();
    
    // Get trip data
    let tripData: any;
    
    if (calculateHosDto.trip_id) {
      const trip = await this.tripsRepository.findOne({ 
        where: { id: calculateHosDto.trip_id } 
      });
      if (!trip) {
        throw new Error('Trip not found');
      }
      tripData = {
        miles: parseFloat(trip.estimated_mileage.toString()),
        avg_speed_mph: parseFloat(trip.average_speed.toString()),
        pre_trip_minutes: trip.pre_trip_minutes,
        post_trip_minutes: trip.post_trip_minutes,
        stop_minutes: trip.stop_minutes,
        service_task_minutes: trip.dump_fuel_clean_minutes,
        deadhead_miles: parseFloat(trip.deadhead_miles.toString()),
        deadhead_speed_mph: parseFloat(trip.deadhead_speed.toString()),
        weekly_hours_used: 0, // TODO: Calculate from driver history
        hos_mode: '70_8',
      };
    } else {
      tripData = calculateHosDto;
    }

    // Calculate hours
    const drivingHours = (tripData.miles || 0) / (tripData.avg_speed_mph || 55);
    const deadheadHours = (tripData.deadhead_miles || 0) / (tripData.deadhead_speed_mph || 60);
    const totalDrivingHours = drivingHours + deadheadHours;
    
    const onDutyHours = totalDrivingHours + 
      ((tripData.pre_trip_minutes || 15) + 
       (tripData.stop_minutes || 0) + 
       (tripData.service_task_minutes || 0) + 
       (tripData.post_trip_minutes || 15)) / 60;

    // Get limits
    const maxDrivingHours = settings.hos_11_hour_limit_minutes / 60;
    const maxDutyHours = settings.hos_14_hour_limit_minutes / 60;
    const maxWeeklyHours = tripData.hos_mode === '60_7' ? 60 : 70;
    const breakRequiredAfter = settings.break_required_after_minutes / 60;

    // Calculate remaining
    const remainingDriving = Math.max(0, maxDrivingHours - totalDrivingHours);
    const remainingDuty = Math.max(0, maxDutyHours - onDutyHours);
    const remainingWeekly = Math.max(0, maxWeeklyHours - (tripData.weekly_hours_used || 0) - onDutyHours);

    // Detect violations
    const violations = [];
    
    if (totalDrivingHours > maxDrivingHours) {
      violations.push({
        type: 'DRIVING_LIMIT',
        severity: 'CRITICAL',
        message: `Driving time (${totalDrivingHours.toFixed(1)}h) exceeds ${maxDrivingHours}-hour limit`,
        excess: totalDrivingHours - maxDrivingHours,
      });
    }

    if (onDutyHours > maxDutyHours) {
      violations.push({
        type: 'DUTY_LIMIT',
        severity: 'CRITICAL', 
        message: `On-duty time (${onDutyHours.toFixed(1)}h) exceeds ${maxDutyHours}-hour limit`,
        excess: onDutyHours - maxDutyHours,
      });
    }

    if ((tripData.weekly_hours_used || 0) + onDutyHours > maxWeeklyHours) {
      violations.push({
        type: 'WEEKLY_LIMIT',
        severity: 'WARNING',
        message: `Weekly hours exceed ${maxWeeklyHours}-hour limit`,
        excess: (tripData.weekly_hours_used || 0) + onDutyHours - maxWeeklyHours,
      });
    }

    const breakRequired = totalDrivingHours >= breakRequiredAfter;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      tripData, 
      violations, 
      totalDrivingHours, 
      maxDrivingHours
    );

    // Determine status
    let status = 'LEGAL';
    let legalityStatus = 'legal';
    
    if (violations.some(v => v.severity === 'CRITICAL')) {
      status = 'ILLEGAL';
      legalityStatus = 'illegal';
    } else if (violations.length > 0 || totalDrivingHours >= 8) {
      status = 'WARNING';
      legalityStatus = 'warning';
    }

    return {
      status,
      legality_status: legalityStatus,
      driving_hours: parseFloat(totalDrivingHours.toFixed(2)),
      on_duty_hours: parseFloat(onDutyHours.toFixed(2)),
      remaining_driving: parseFloat(remainingDriving.toFixed(2)),
      remaining_duty: parseFloat(remainingDuty.toFixed(2)),
      remaining_weekly: parseFloat(remainingWeekly.toFixed(2)),
      break_required: breakRequired,
      violations,
      recommendations,
    };
  }

  private generateRecommendations(tripData: any, violations: any[], drivingHours: number, maxDriving: number): any[] {
    const recommendations = [];

    violations.forEach(violation => {
      switch (violation.type) {
        case 'DRIVING_LIMIT':
          const excessMiles = violation.excess * (tripData.avg_speed_mph || 55);
          recommendations.push({
            type: 'DEADHEAD',
            priority: 'HIGH',
            message: `Reposition bus ${Math.ceil(excessMiles)} miles closer day before`,
            solution: 'deadhead',
          });
          recommendations.push({
            type: 'RELAY',
            priority: 'HIGH',
            message: `Switch drivers at ${Math.floor(maxDriving * (tripData.avg_speed_mph || 55))} mile mark`,
            solution: 'relay',
          });
          break;

        case 'DUTY_LIMIT':
          recommendations.push({
            type: 'HOTEL',
            priority: 'HIGH',
            message: 'Schedule overnight hotel stop mid-trip',
            solution: 'hotel',
          });
          recommendations.push({
            type: 'RELAY',
            priority: 'MEDIUM',
            message: 'Switch drivers mid-route to complete trip',
            solution: 'relay',
          });
          break;

        case 'WEEKLY_LIMIT':
          recommendations.push({
            type: 'RESTART',
            priority: 'CRITICAL',
            message: '34-hour restart required before trip',
            solution: 'restart',
          });
          break;
      }
    });

    // Add general recommendations
    if (violations.length === 0) {
      recommendations.push({
        type: 'GENERAL',
        priority: 'INFO',
        message: 'Trip complies with all DOT regulations',
        solution: 'none',
      });

      if (drivingHours >= 8) {
        recommendations.push({
          type: 'BREAK',
          priority: 'INFO',
          message: '30-minute break required after 8 hours of driving',
          solution: 'break',
        });
      }
    }

    return recommendations;
  }
}
