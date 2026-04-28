/**
 * PayController.js
 * Handles driver pay calculations
 */

class PayController {
    constructor(payService) {
        this.payService = payService;
    }

    calculateTripPay(payData) {
        // Validate required fields
        if (!payData.driverType) {
            throw new Error('Driver type is required');
        }

        return this.payService.calculateTripPay(payData);
    }

    calculateDeadheadBonus(hours) {
        return this.payService.calculateDeadheadBonus(hours);
    }

    calculateRelayBonus(hours) {
        return this.payService.calculateRelayBonus(hours);
    }

    calculateWeeklyPay(driverId, startDate, endDate) {
        return this.payService.calculateWeeklyPay(driverId, startDate, endDate);
    }

    getPayStructures() {
        return this.payService.getPayStructures();
    }

    updatePayStructure(structureType, structureData) {
        return this.payService.updatePayStructure(structureType, structureData);
    }
}

module.exports = PayController;
