import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayStructure } from '../../entities/pay-structure.entity';
import { BonusRule } from '../../entities/bonus-rule.entity';
import { Trip } from '../../entities/trip.entity';
import { CalculatePayDto } from './dto/calculate-pay.dto';

export interface PayCalculationResult {
  driver_type: string;
  weekly_salary: number;
  base_pay: number;
  gratuity: number;
  safety_bonus: number;
  deadhead_bonus: number;
  relay_bonus: number;
  trip_share: number;
  total_pay: number;
  breakdown: any[];
}

@Injectable()
export class PayService {
  // Default pay structures
  private readonly WEEKLY_SALARY = 400;
  private readonly CONTRACT_BASE = 0.12;
  private readonly CONTRACT_SAFETY = 0.04;
  private readonly RETAIL_GRATUITY = 0.20;
  private readonly RETAIL_SAFETY = 0.04;
  private readonly SEDAN_BASE = 0.10;
  private readonly SEDAN_GRATUITY = 0.20;
  private readonly VAN_BASE = 0.08;
  private readonly VAN_GRATUITY = 0.20;
  private readonly HALF_DAY_FLAT = 150;
  private readonly FULL_DAY_FLAT = 275;
  private readonly FLAT_SAFETY = 50;

  constructor(
    @InjectRepository(PayStructure)
    private payStructureRepository: Repository<PayStructure>,
    @InjectRepository(BonusRule)
    private bonusRuleRepository: Repository<BonusRule>,
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
  ) {}

  async calculateForTrip(calculatePayDto: CalculatePayDto): Promise<PayCalculationResult> {
    const {
      driver_type,
      trip_type,
      vehicle_type,
      revenue,
      includes_deadhead = false,
      deadhead_duration_hours = 0,
      includes_relay = false,
      relay_duration_hours = 0,
      is_safety_eligible = false,
    } = calculatePayDto;

    let basePay = 0;
    let gratuity = 0;
    let safetyBonus = 0;
    const breakdown = [];

    // Calculate based on driver type
    if (driver_type === 'full_time') {
      if (trip_type === 'contract') {
        basePay = revenue * this.CONTRACT_BASE;
        breakdown.push({ label: 'Base Pay (12%)', amount: basePay });
        
        if (is_safety_eligible) {
          safetyBonus = revenue * this.CONTRACT_SAFETY;
          breakdown.push({ label: 'Safety Bonus (4%)', amount: safetyBonus });
        }
      } else if (trip_type === 'retail') {
        gratuity = revenue * this.RETAIL_GRATUITY;
        breakdown.push({ label: 'Gratuity (20%)', amount: gratuity });
        
        if (is_safety_eligible) {
          safetyBonus = revenue * this.RETAIL_SAFETY;
          breakdown.push({ label: 'Safety Bonus (4%)', amount: safetyBonus });
        }
      }
    } else if (driver_type === 'part_time') {
      if (vehicle_type === 'sedan_suv') {
        basePay = revenue * this.SEDAN_BASE;
        gratuity = revenue * this.SEDAN_GRATUITY;
        breakdown.push({ label: 'Base (10%)', amount: basePay });
        breakdown.push({ label: 'Gratuity (20%)', amount: gratuity });
        
        if (is_safety_eligible) {
          safetyBonus = revenue * 0.04;
          breakdown.push({ label: 'Safety (4%)', amount: safetyBonus });
        }
      } else if (vehicle_type === 'van_motorcoach') {
        basePay = revenue * this.VAN_BASE;
        gratuity = revenue * this.VAN_GRATUITY;
        breakdown.push({ label: 'Base (8%)', amount: basePay });
        breakdown.push({ label: 'Gratuity (20%)', amount: gratuity });
        
        if (is_safety_eligible) {
          safetyBonus = revenue * 0.04;
          breakdown.push({ label: 'Safety (4%)', amount: safetyBonus });
        }
      } else if (vehicle_type === 'half_day') {
        basePay = this.HALF_DAY_FLAT;
        breakdown.push({ label: 'Half Day Flat', amount: basePay });
        
        if (is_safety_eligible) {
          safetyBonus = this.FLAT_SAFETY;
          breakdown.push({ label: 'Safety Bonus', amount: safetyBonus });
        }
      } else if (vehicle_type === 'full_day') {
        basePay = this.FULL_DAY_FLAT;
        breakdown.push({ label: 'Full Day Flat', amount: basePay });
        
        if (is_safety_eligible) {
          safetyBonus = this.FLAT_SAFETY;
          breakdown.push({ label: 'Safety Bonus', amount: safetyBonus });
        }
      }
    }

    // Calculate bonuses
    const deadheadBonus = includes_deadhead ? await this.calculateDeadheadBonus(deadhead_duration_hours) : 0;
    if (deadheadBonus > 0) {
      breakdown.push({ label: 'Deadhead Bonus', amount: deadheadBonus });
    }

    const relayBonus = includes_relay ? await this.calculateRelayBonus(relay_duration_hours) : 0;
    if (relayBonus > 0) {
      breakdown.push({ label: 'Relay Bonus', amount: relayBonus });
    }

    const tripShare = basePay + gratuity + safetyBonus;
    const totalPay = tripShare + deadheadBonus + relayBonus;

    return {
      driver_type,
      weekly_salary: driver_type === 'full_time' ? this.WEEKLY_SALARY : 0,
      base_pay: parseFloat(basePay.toFixed(2)),
      gratuity: parseFloat(gratuity.toFixed(2)),
      safety_bonus: parseFloat(safetyBonus.toFixed(2)),
      deadhead_bonus: parseFloat(deadheadBonus.toFixed(2)),
      relay_bonus: parseFloat(relayBonus.toFixed(2)),
      trip_share: parseFloat(tripShare.toFixed(2)),
      total_pay: parseFloat(totalPay.toFixed(2)),
      breakdown,
    };
  }

  private async calculateDeadheadBonus(hours: number): Promise<number> {
    const rules = await this.bonusRuleRepository.find({
      where: { type: 'deadhead', active: true },
      order: { min_hours: 'ASC' },
    });

    if (rules.length === 0) {
      // Default rules
      if (hours < 4) return 100;
      if (hours < 8) return 200;
      return 300;
    }

    for (const rule of rules) {
      if (hours >= parseFloat(rule.min_hours.toString()) && hours < parseFloat(rule.max_hours.toString())) {
        return parseFloat(rule.amount.toString());
      }
    }

    return 0;
  }

  private async calculateRelayBonus(hours: number): Promise<number> {
    const rules = await this.bonusRuleRepository.find({
      where: { type: 'relay', active: true },
      order: { min_hours: 'ASC' },
    });

    if (rules.length === 0) {
      // Default rules
      if (hours < 6) return 200;
      return 325;
    }

    for (const rule of rules) {
      if (hours >= parseFloat(rule.min_hours.toString()) && hours < parseFloat(rule.max_hours.toString())) {
        return parseFloat(rule.amount.toString());
      }
    }

    return 0;
  }

  async getPayStructures(): Promise<any> {
    return {
      fullTime: {
        weeklySalary: this.WEEKLY_SALARY,
        contractBase: this.CONTRACT_BASE,
        contractSafety: this.CONTRACT_SAFETY,
        retailGratuity: this.RETAIL_GRATUITY,
        retailSafety: this.RETAIL_SAFETY,
      },
      partTime: {
        sedanBase: this.SEDAN_BASE,
        sedanGratuity: this.SEDAN_GRATUITY,
        vanBase: this.VAN_BASE,
        vanGratuity: this.VAN_GRATUITY,
        halfDayFlat: this.HALF_DAY_FLAT,
        fullDayFlat: this.FULL_DAY_FLAT,
        flatSafety: this.FLAT_SAFETY,
      },
    };
  }

  async getBonusRules(): Promise<BonusRule[]> {
    return await this.bonusRuleRepository.find({ where: { active: true } });
  }
}
