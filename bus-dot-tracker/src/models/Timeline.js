/**
 * Timeline.js
 * Trip timeline model
 */

class Timeline {
    constructor(data = {}) {
        this.id = data.id || null;
        this.tripId = data.tripId || null;
        this.segments = data.segments || [];
        this.totalDuration = data.totalDuration || 0;
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;
        this.createdAt = data.createdAt || Date.now();
    }

    addSegment(segment) {
        this.segments.push({
            type: segment.type,
            duration: segment.duration,
            icon: segment.icon,
            label: segment.label,
            color: segment.color,
            startTime: segment.startTime,
            endTime: segment.endTime
        });
        this.totalDuration = this.segments.reduce((sum, s) => sum + s.duration, 0);
    }

    getSegmentsByType(type) {
        return this.segments.filter(s => s.type === type);
    }

    calculateTotalDriving() {
        return this.segments
            .filter(s => s.type === 'DRIVE' || s.type === 'DEADHEAD')
            .reduce((sum, s) => sum + s.duration, 0);
    }

    calculateTotalOnDuty() {
        return this.segments
            .filter(s => s.type !== 'OFF_DUTY' && s.type !== 'SLEEPER')
            .reduce((sum, s) => sum + s.duration, 0);
    }

    toJSON() {
        return {
            id: this.id,
            tripId: this.tripId,
            segments: this.segments,
            totalDuration: this.totalDuration,
            startTime: this.startTime,
            endTime: this.endTime,
            totalDriving: this.calculateTotalDriving(),
            totalOnDuty: this.calculateTotalOnDuty(),
            createdAt: this.createdAt
        };
    }
}

module.exports = Timeline;
