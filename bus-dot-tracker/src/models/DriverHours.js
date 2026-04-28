/**
 * DriverHours.js
 * Driver hours tracking model
 */

class DriverHours {
    constructor(data = {}) {
        this.id = data.id || null;
        this.driverId = data.driverId || null;
        this.drivingHours = data.drivingHours || 0;
        this.onDutyHours = data.onDutyHours || 0;
        this.weeklyHours = data.weeklyHours || 0;
        this.timeSinceBreak = data.timeSinceBreak || 0;
        this.currentStatus = data.currentStatus || 'off-duty'; // driving, on-duty, off-duty, sleeper
        this.statusStartTime = data.statusStartTime || Date.now();
        this.lastBreakTime = data.lastBreakTime || null;
        this.lastResetTime = data.lastResetTime || null;
        this.resetType = data.resetType || null; // 10HR_DAILY, 34HR_RESTART
        this.hosMode = data.hosMode || '70_8';
        this.updatedAt = data.updatedAt || Date.now();
    }

    getRemainingHours() {
        const maxWeekly = this.hosMode === '60_7' ? 60 : 70;
        
        return {
            driving: Math.max(0, 10 - this.drivingHours),
            onDuty: Math.max(0, 15 - this.onDutyHours),
            weekly: Math.max(0, maxWeekly - this.weeklyHours)
        };
    }

    needsBreak() {
        return this.timeSinceBreak >= 8;
    }

    needsReset() {
        const needsDaily = this.drivingHours >= 10 || this.onDutyHours >= 15;
        const maxWeekly = this.hosMode === '60_7' ? 60 : 70;
        const needsRestart = this.weeklyHours >= maxWeekly;
        
        return {
            daily: needsDaily,
            restart: needsRestart,
            type: needsRestart ? '34HR_RESTART' : (needsDaily ? '10HR_DAILY' : null)
        };
    }

    toJSON() {
        return {
            id: this.id,
            driverId: this.driverId,
            drivingHours: this.drivingHours,
            onDutyHours: this.onDutyHours,
            weeklyHours: this.weeklyHours,
            timeSinceBreak: this.timeSinceBreak,
            currentStatus: this.currentStatus,
            statusStartTime: this.statusStartTime,
            lastBreakTime: this.lastBreakTime,
            lastResetTime: this.lastResetTime,
            resetType: this.resetType,
            hosMode: this.hosMode,
            updatedAt: this.updatedAt,
            remaining: this.getRemainingHours(),
            needsBreak: this.needsBreak(),
            needsReset: this.needsReset()
        };
    }
}

module.exports = DriverHours;
