/**
 * DriverHoursService.js
 * Tracks and manages driver hours
 */

class DriverHoursService {
    /**
     * Update driver hours based on status change
     * @param {Object} driverHours - Current driver hours
     * @param {string} previousStatus - Previous status
     * @param {number} duration - Duration in hours
     * @returns {Object} Updated driver hours
     */
    updateDriverHours(driverHours, previousStatus, duration) {
        const updated = { ...driverHours };

        if (previousStatus === 'driving') {
            updated.drivingHours += duration;
            updated.onDutyHours += duration;
            updated.weeklyHours += duration;
            updated.timeSinceBreak += duration;
        } else if (previousStatus === 'on-duty') {
            updated.onDutyHours += duration;
            updated.weeklyHours += duration;
            updated.timeSinceBreak += duration;
        } else if (previousStatus === 'off-duty' && duration >= 0.5) {
            // Reset break counter if off-duty for 30+ minutes
            updated.timeSinceBreak = 0;
        }

        updated.lastUpdated = Date.now();
        return updated;
    }

    /**
     * Perform daily reset (10-hour off-duty)
     * @param {Object} driverHours - Current driver hours
     * @returns {Object} Reset driver hours
     */
    performDailyReset(driverHours) {
        return {
            ...driverHours,
            drivingHours: 0,
            onDutyHours: 0,
            timeSinceBreak: 0,
            lastReset: Date.now(),
            resetType: '10HR_DAILY'
        };
    }

    /**
     * Perform 34-hour restart
     * @param {Object} driverHours - Current driver hours
     * @returns {Object} Reset driver hours
     */
    perform34HourRestart(driverHours) {
        return {
            drivingHours: 0,
            onDutyHours: 0,
            weeklyHours: 0,
            timeSinceBreak: 0,
            lastReset: Date.now(),
            resetType: '34HR_RESTART',
            hosMode: driverHours.hosMode || '70_8'
        };
    }

    /**
     * Calculate when next reset is available
     * @param {Object} driverHours - Current driver hours
     * @param {number} currentOffDutyDuration - Current off-duty duration in hours
     * @returns {Object} Reset availability
     */
    calculateResetAvailability(driverHours, currentOffDutyDuration = 0) {
        const daily = {
            available: currentOffDutyDuration >= 10,
            hoursRemaining: Math.max(0, 10 - currentOffDutyDuration),
            progress: Math.min(100, (currentOffDutyDuration / 10) * 100)
        };

        const restart = {
            available: currentOffDutyDuration >= 34,
            hoursRemaining: Math.max(0, 34 - currentOffDutyDuration),
            progress: Math.min(100, (currentOffDutyDuration / 34) * 100)
        };

        return { daily, restart };
    }

    /**
     * Get driver hours summary
     * @param {number} driverId - Driver ID
     * @returns {Object} Hours summary
     */
    getDriverHoursSummary(driverId) {
        // Mock implementation - would fetch from database
        return {
            driverId,
            drivingHours: 0,
            onDutyHours: 0,
            weeklyHours: 0,
            timeSinceBreak: 0,
            hosMode: '70_8'
        };
    }
}

module.exports = DriverHoursService;
