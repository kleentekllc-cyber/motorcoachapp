/**
 * PayService.js
 * Calculates driver compensation
 */

class PayService {
    constructor() {
        // Full-Time Pay Structures
        this.WEEKLY_SALARY = 400;
        this.CONTRACT_BASE = 0.12;
        this.CONTRACT_SAFETY = 0.04;
        this.RETAIL_GRATUITY = 0.20;
        this.RETAIL_SAFETY = 0.04;

        // Part-Time Pay Structures
        this.SEDAN_BASE = 0.10;
        this.SEDAN_GRATUITY = 0.20;
        this.VAN_BASE = 0.08;
        this.VAN_GRATUITY = 0.20;
        this.HALF_DAY_FLAT = 150;
        this.FULL_DAY_FLAT = 275;
        this.FLAT_SAFETY = 50;

        // Bonuses
        this.DEADHEAD_PAY = [
            { maxHours: 4, base: 50, bonus: 50, total: 100 },
            { maxHours: 8, base: 150, bonus: 50, total: 200 },
            { maxHours: Infinity, base: 250, bonus: 50, total: 300 }
        ];

        this.RELAY_PAY = [
            { maxHours: 6, base: 150, bonus: 50, total: 200 },
            { maxHours: Infinity, base: 275, bonus: 50, total: 325 }
        ];
    }

    calculateTripPay(payData) {
        const {
            driverType,
            tripType,
            vehicleType,
            tripRevenue,
            includesDeadhead = false,
            deadheadDurationHours = 0,
            includesRelay = false,
            relayDurationHours = 0,
            isSafetyEligible = false
        } = payData;

        let basePay = 0;
        let safetyBonus = 0;
        let payLabel = '';

        // Calculate based on driver type
        if (driverType === 'full-time') {
            if (tripType === 'contract') {
                basePay = tripRevenue * this.CONTRACT_BASE;
                payLabel = 'Base Pay (12%)';
                if (isSafetyEligible) {
                    safetyBonus = tripRevenue * this.CONTRACT_SAFETY;
                }
            } else if (tripType === 'retail') {
                basePay = tripRevenue * this.RETAIL_GRATUITY;
                payLabel = 'Gratuity (20%)';
                if (isSafetyEligible) {
                    safetyBonus = tripRevenue * this.RETAIL_SAFETY;
                }
            }
        } else if (driverType === 'part-time') {
            if (vehicleType === 'sedan-suv') {
                basePay = tripRevenue * (this.SEDAN_BASE + this.SEDAN_GRATUITY);
                payLabel = 'Base+Gratuity (30%)';
                if (isSafetyEligible) {
                    safetyBonus = tripRevenue * 0.04;
                }
            } else if (vehicleType === 'van-motorcoach') {
                basePay = tripRevenue * (this.VAN_BASE + this.VAN_GRATUITY);
                payLabel = 'Base+Gratuity (28%)';
                if (isSafetyEligible) {
                    safetyBonus = tripRevenue * 0.04;
                }
            } else if (vehicleType === 'half-day') {
                basePay = this.HALF_DAY_FLAT;
                payLabel = 'Half Day Flat Rate';
                if (isSafetyEligible) {
                    safetyBonus = this.FLAT_SAFETY;
                }
            } else if (vehicleType === 'full-day') {
                basePay = this.FULL_DAY_FLAT;
                payLabel = 'Full Day Flat Rate';
                if (isSafetyEligible) {
                    safetyBonus = this.FLAT_SAFETY;
                }
            }
        }

        const deadheadPay = includesDeadhead ? this.calculateDeadheadBonus(deadheadDurationHours) : 0;
        const relayPay = includesRelay ? this.calculateRelayBonus(relayDurationHours) : 0;

        const tripShare = basePay + safetyBonus;
        const totalPay = tripShare + deadheadPay + relayPay;

        return {
            driverType,
            payLabel,
            basePay: basePay.toFixed(2),
            safetyBonus: safetyBonus.toFixed(2),
            deadheadPay: deadheadPay.toFixed(2),
            relayPay: relayPay.toFixed(2),
            tripShare: tripShare.toFixed(2),
            totalPay: totalPay.toFixed(2),
            weeklySalary: driverType === 'full-time' ? this.WEEKLY_SALARY : 0
        };
    }

    calculateDeadheadBonus(hours) {
        for (const tier of this.DEADHEAD_PAY) {
            if (hours <= tier.maxHours) {
                return tier.total;
            }
        }
        return 0;
    }

    calculateRelayBonus(hours) {
        for (const tier of this.RELAY_PAY) {
            if (hours <= tier.maxHours) {
                return tier.total;
            }
        }
        return 0;
    }

    calculateWeeklyPay(driverId, startDate, endDate) {
        // Mock implementation - would fetch trips from database
        return {
            weeklySalary: this.WEEKLY_SALARY,
            tripEarnings: 0,
            bonuses: 0,
            totalPay: this.WEEKLY_SALARY
        };
    }

    getPayStructures() {
        return {
            fullTime: {
                weeklySalary: this.WEEKLY_SALARY,
                contractBase: this.CONTRACT_BASE,
                contractSafety: this.CONTRACT_SAFETY,
                retailGratuity: this.RETAIL_GRATUITY,
                retailSafety: this.RETAIL_SAFETY
            },
            partTime: {
                sedanBase: this.SEDAN_BASE,
                sedanGratuity: this.SEDAN_GRATUITY,
                vanBase: this.VAN_BASE,
                vanGratuity: this.VAN_GRATUITY,
                halfDayFlat: this.HALF_DAY_FLAT,
                fullDayFlat: this.FULL_DAY_FLAT,
                flatSafety: this.FLAT_SAFETY
            },
            bonuses: {
                deadhead: this.DEADHEAD_PAY,
                relay: this.RELAY_PAY
            }
        };
    }

    updatePayStructure(structureType, structureData) {
        // Would update database in production
        return { success: true, updated: structureType };
    }
}

module.exports = PayService;
