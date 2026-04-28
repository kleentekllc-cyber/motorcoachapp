/**
 * HOSController.js
 * Handles Hours of Service calculations and validations
 */

class HOSController {
    constructor(hosService) {
        this.hosService = hosService;
    }

    validateTrip(tripData) {
        return this.hosService.validateTrip(tripData);
    }

    calculateRemainingHours(driverData) {
        return this.hosService.calculateRemainingHours(driverData);
    }

    checkBreakRequired(driverData) {
        return this.hosService.checkBreakRequired(driverData);
    }

    calculate34HourRestart(driverData) {
        return this.hosService.calculate34HourRestart(driverData);
    }

    validateMultiDayTrip(trips, driverData) {
        return this.hosService.validateMultiDayTrip(trips, driverData);
    }

    detectViolations(tripData) {
        return this.hosService.detectViolations(tripData);
    }

    generateRecommendations(tripData, violations) {
        return this.hosService.generateRecommendations(tripData, violations);
    }
}

module.exports = HOSController;
