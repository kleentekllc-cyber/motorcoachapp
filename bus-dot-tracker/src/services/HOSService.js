/**
 * HOSService.js
 * Core business logic for Hours of Service calculations
 */

class HOSService {
    constructor() {
        this.MAX_DRIVING_HOURS = 10;
        this.MAX_DUTY_HOURS = 15;
        this.BREAK_REQUIRED_AFTER = 8;
        this.BREAK_DURATION = 0.5; // 30 minutes
        this.RESTART_HOURS = 34;
        this.DAILY_RESET_HOURS = 10;
    }

    /**
     * Validate trip against DOT HOS regulations
     * @param {Object} tripData - Trip parameters
     * @returns {Object} Validation result with status, violations, recommendations
     */
    validateTrip(tripData) {
        const {
            miles,
            avgSpeedMph,
            preTripMinutes = 15,
            postTripMinutes = 15,
            stopMinutes = 0,
            serviceTaskMinutes = 0,
            deadheadMiles = 0,
            deadheadSpeedMph = 60,
            weeklyHoursUsed = 0,
            hosMode = "70_8"
        } = tripData;

        // Calculate hours
        const drivingHours = miles / avgSpeedMph;
        const deadheadHours = deadheadMiles > 0 ? deadheadMiles / deadheadSpeedMph : 0;
        const totalDrivingHours = drivingHours + deadheadHours;
        const onDutyHours = totalDrivingHours + (preTripMinutes + stopMinutes + serviceTaskMinutes + postTripMinutes) / 60;

        // Get weekly limit based on HOS mode
        const maxWeeklyHours = hosMode === "60_7" ? 60 : 70;

        // Detect violations
        const violations = this.detectViolations({
            totalDrivingHours,
            onDutyHours,
            weeklyHoursUsed,
            maxWeeklyHours
        });

        // Determine overall status
        let status = "LEGAL";
        if (violations.length > 0) {
            if (violations.some(v => v.severity === "CRITICAL")) {
                status = "ILLEGAL";
            } else {
                status = "WARNING";
            }
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(tripData, violations);

        return {
            status,
            violations,
            recommendations,
            calculations: {
                drivingHours,
                deadheadHours,
                totalDrivingHours,
                onDutyHours,
                remainingDriving: Math.max(0, this.MAX_DRIVING_HOURS - totalDrivingHours),
                remainingDuty: Math.max(0, this.MAX_DUTY_HOURS - onDutyHours),
                remainingWeekly: Math.max(0, maxWeeklyHours - (weeklyHoursUsed + onDutyHours))
            }
        };
    }

    /**
     * Detect DOT HOS violations
     * @param {Object} data - Hours data
     * @returns {Array} List of violations
     */
    detectViolations(data) {
        const violations = [];
        const { totalDrivingHours, onDutyHours, weeklyHoursUsed, maxWeeklyHours } = data;

        if (totalDrivingHours > this.MAX_DRIVING_HOURS) {
            violations.push({
                type: "DRIVING_LIMIT",
                severity: "CRITICAL",
                message: `Driving time (${totalDrivingHours.toFixed(1)}h) exceeds 10-hour limit`,
                excess: totalDrivingHours - this.MAX_DRIVING_HOURS
            });
        }

        if (onDutyHours > this.MAX_DUTY_HOURS) {
            violations.push({
                type: "DUTY_LIMIT",
                severity: "CRITICAL",
                message: `On-duty time (${onDutyHours.toFixed(1)}h) exceeds 15-hour limit`,
                excess: onDutyHours - this.MAX_DUTY_HOURS
            });
        }

        if (weeklyHoursUsed + onDutyHours > maxWeeklyHours) {
            violations.push({
                type: "WEEKLY_LIMIT",
                severity: "WARNING",
                message: `Weekly hours (${(weeklyHoursUsed + onDutyHours).toFixed(1)}h) exceed ${maxWeeklyHours}-hour limit`,
                excess: (weeklyHoursUsed + onDutyHours) - maxWeeklyHours
            });
        }

        return violations;
    }

    /**
     * Generate recommendations based on violations
     * @param {Object} tripData - Trip parameters
     * @param {Array} violations - Detected violations
     * @returns {Array} List of recommendations
     */
    generateRecommendations(tripData, violations) {
        const recommendations = [];
        const { miles, avgSpeedMph, deadheadMiles } = tripData;

        violations.forEach(violation => {
            switch (violation.type) {
                case "DRIVING_LIMIT":
                    const excessMiles = violation.excess * avgSpeedMph;
                    recommendations.push({
                        type: "DEADHEAD",
                        priority: "HIGH",
                        message: `Reposition bus ${excessMiles.toFixed(0)} miles closer day before`,
                        solution: "deadhead"
                    });
                    recommendations.push({
                        type: "RELAY",
                        priority: "HIGH",
                        message: `Switch drivers at ${(this.MAX_DRIVING_HOURS * avgSpeedMph).toFixed(0)} mile mark`,
                        solution: "relay"
                    });
                    break;

                case "DUTY_LIMIT":
                    recommendations.push({
                        type: "HOTEL",
                        priority: "HIGH",
                        message: "Schedule overnight hotel stop mid-trip",
                        solution: "hotel"
                    });
                    recommendations.push({
                        type: "RELAY",
                        priority: "MEDIUM",
                        message: "Switch drivers mid-route to complete trip",
                        solution: "relay"
                    });
                    break;

                case "WEEKLY_LIMIT":
                    recommendations.push({
                        type: "RESTART",
                        priority: "CRITICAL",
                        message: "34-hour restart required before trip",
                        solution: "restart"
                    });
                    break;
            }
        });

        // Add general recommendations even if no violations
        if (violations.length === 0) {
            recommendations.push({
                type: "GENERAL",
                priority: "INFO",
                message: "Trip complies with all DOT regulations",
                solution: "none"
            });

            if ((tripData.miles / tripData.avgSpeedMph) >= 8) {
                recommendations.push({
                    type: "BREAK",
                    priority: "INFO",
                    message: "30-minute break required after 8 hours",
                    solution: "break"
                });
            }
        }

        return recommendations;
    }

    /**
     * Calculate remaining hours for a driver
     * @param {Object} driverData - Driver's current hours
     * @returns {Object} Remaining hours
     */
    calculateRemainingHours(driverData) {
        const {
            drivingHours = 0,
            onDutyHours = 0,
            weeklyHours = 0,
            hosMode = "70_8"
        } = driverData;

        const maxWeeklyHours = hosMode === "60_7" ? 60 : 70;

        return {
            remainingDriving: Math.max(0, this.MAX_DRIVING_HOURS - drivingHours),
            remainingDuty: Math.max(0, this.MAX_DUTY_HOURS - onDutyHours),
            remainingWeekly: Math.max(0, maxWeeklyHours - weeklyHours)
        };
    }

    /**
     * Check if break is required
     * @param {Object} driverData - Driver's hours since last break
     * @returns {Object} Break requirement status
     */
    checkBreakRequired(driverData) {
        const { timeSinceBreak = 0 } = driverData;

        return {
            breakRequired: timeSinceBreak >= this.BREAK_REQUIRED_AFTER,
            hoursToBreak: Math.max(0, this.BREAK_REQUIRED_AFTER - timeSinceBreak),
            breakDuration: this.BREAK_DURATION
        };
    }

    /**
     * Calculate 34-hour restart progress
      * @param {Object} driverData - Driver's off-duty time
     * @returns {Object} Restart calculation
     */
    calculate34HourRestart(driverData) {
        const { currentOffDutyHours = 0 } = driverData;

        return {
            hoursRemaining: Math.max(0, this.RESTART_HOURS - currentOffDutyHours),
            isComplete: currentOffDutyHours >= this.RESTART_HOURS,
            progress: Math.min(100, (currentOffDutyHours / this.RESTART_HOURS) * 100)
        };
    }

    /**
     * Validate multi-day trip with rest periods
     * @param {Array} trips - Array of trips
     * @param {Object} driverData - Driver's starting hours
     * @returns {Object} Multi-day validation result
     */
    validateMultiDayTrip(trips, driverData) {
        let weeklyAccum = driverData.weeklyHours || 0;
        let dayDriving = 0;
        let dayDuty = 0;
        let day = 1;
        const maxWeekly = driverData.hosMode === "60_7" ? 60 : 70;
        const schedule = [];

        trips.forEach((trip, index) => {
            const tripHours = this.calculateTripHours(trip);
            
            // Check if trip fits in current day
            if (dayDriving + tripHours.driving <= this.MAX_DRIVING_HOURS &&
                dayDuty + tripHours.onDuty <= this.MAX_DUTY_HOURS &&
                weeklyAccum + tripHours.onDuty <= maxWeekly) {
                
                schedule.push({
                    day,
                    tripIndex: index,
                    action: "TRIP",
                    hours: tripHours
                });
                
                dayDriving += tripHours.driving;
                dayDuty += tripHours.onDuty;
                weeklyAccum += tripHours.onDuty;
            } else {
                // Need reset
                if (weeklyAccum + tripHours.onDuty > maxWeekly) {
                    schedule.push({ day, action: "34HR_RESTART" });
                    day += 2;
                    weeklyAccum = 0;
                } else {
                    schedule.push({ day, action: "10HR_RESET" });
                    day++;
                }
                
                dayDriving = 0;
                dayDuty = 0;
            }
        });

        return {
            totalDays: day,
            schedule,
            feasible: day <= 14
        };
    }

    /**
     * Calculate total hours for a trip
     * @param {Object} trip - Trip data
     * @returns {Object} Calculated hours
     */
    calculateTripHours(trip) {
        const driving = trip.miles / trip.avgSpeedMph;
        const deadhead = trip.deadheadMiles ? trip.deadheadMiles / (trip.deadheadSpeedMph || 60) : 0;
        const onDuty = driving + deadhead + ((trip.preTripMinutes || 15) + (trip.stopMinutes || 0) + (trip.serviceTaskMinutes || 0) + (trip.postTripMinutes || 15)) / 60;

        return { driving: driving + deadhead, onDuty };
    }
}

module.exports = HOSService;
