/**
 * Trip.js
 * Trip data model
 */

class Trip {
    constructor(data = {}) {
        this.id = data.id || null;
        this.miles = data.miles || 0;
        this.avgSpeedMph = data.avgSpeedMph || 55;
        this.preTripMinutes = data.preTripMinutes || 15;
        this.postTripMinutes = data.postTripMinutes || 15;
        this.stopMinutes = data.stopMinutes || 0;
        this.serviceTaskMinutes = data.serviceTaskMinutes || 0;
        this.deadheadMiles = data.deadheadMiles || 0;
        this.deadheadSpeedMph = data.deadheadSpeedMph || 60;
        this.weeklyHoursUsed = data.weeklyHoursUsed || 0;
        this.hosMode = data.hosMode || '70_8';
        this.driverId = data.driverId || null;
        this.vehicleId = data.vehicleId || null;
        this.startLocation = data.startLocation || '';
        this.endLocation = data.endLocation || '';
        this.scheduledDate = data.scheduledDate || null;
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;
        this.status = data.status || 'scheduled'; // scheduled, in-progress, completed, cancelled
        this.hosStatus = data.hosStatus || 'pending'; // pending, legal, warning, illegal
        this.violations = data.violations || [];
        this.recommendations = data.recommendations || [];
        this.revenue = data.revenue || 0;
        this.tripType = data.tripType || 'contract'; // contract, retail
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    validate() {
        const errors = [];
        
        if (this.miles <= 0) errors.push('Miles must be greater than 0');
        if (this.avgSpeedMph <= 0 || this.avgSpeedMph > 80) {
            errors.push('Average speed must be between 1 and 80 mph');
        }
        if (!['70_8', '60_7'].includes(this.hosMode)) {
            errors.push('HOS mode must be 70_8 or 60_7');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    calculateDuration() {
        const drivingHours = this.miles / this.avgSpeedMph;
        const deadheadHours = this.deadheadMiles / this.deadheadSpeedMph;
        const totalHours = drivingHours + deadheadHours + 
            (this.preTripMinutes + this.stopMinutes + this.serviceTaskMinutes + this.postTripMinutes) / 60;
        return totalHours;
    }

    toJSON() {
        return {
            id: this.id,
            miles: this.miles,
            avgSpeedMph: this.avgSpeedMph,
            preTripMinutes: this.preTripMinutes,
            postTripMinutes: this.postTripMinutes,
            stopMinutes: this.stopMinutes,
            serviceTaskMinutes: this.serviceTaskMinutes,
            deadheadMiles: this.deadheadMiles,
            deadheadSpeedMph: this.deadheadSpeedMph,
            weeklyHoursUsed: this.weeklyHoursUsed,
            hosMode: this.hosMode,
            driverId: this.driverId,
            vehicleId: this.vehicleId,
            startLocation: this.startLocation,
            endLocation: this.endLocation,
            scheduledDate: this.scheduledDate,
            startTime: this.startTime,
            endTime: this.endTime,
            status: this.status,
            hosStatus: this.hosStatus,
            violations: this.violations,
            recommendations: this.recommendations,
            revenue: this.revenue,
            tripType: this.tripType,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Trip;
