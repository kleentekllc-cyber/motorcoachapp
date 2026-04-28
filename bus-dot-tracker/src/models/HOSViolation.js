/**
 * HOSViolation.js
 * HOS violation tracking model
 */

class HOSViolation {
    constructor(data = {}) {
        this.id = data.id || null;
        this.type = data.type || ''; // DRIVING_LIMIT, DUTY_LIMIT, WEEKLY_LIMIT, BREAK_REQUIRED
        this.severity = data.severity || 'WARNING'; // INFO, WARNING, CRITICAL
        this.message = data.message || '';
        this.excess = data.excess || 0; // How much over the limit
        this.driverId = data.driverId || null;
        this.tripId = data.tripId || null;
        this.timestamp = data.timestamp || Date.now();
        this.resolved = data.resolved || false;
        this.resolutionNotes = data.resolutionNotes || '';
        this.createdAt = data.createdAt || Date.now();
    }

    resolve(notes = '') {
        this.resolved = true;
        this.resolutionNotes = notes;
        this.resolvedAt = Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            severity: this.severity,
            message: this.message,
            excess: this.excess,
            driverId: this.driverId,
            tripId: this.tripId,
            timestamp: this.timestamp,
            resolved: this.resolved,
            resolutionNotes: this.resolutionNotes,
            resolvedAt: this.resolvedAt,
            createdAt: this.createdAt
        };
    }
}

module.exports = HOSViolation;
