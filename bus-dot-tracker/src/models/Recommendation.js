/**
 * Recommendation.js
 * Trip recommendation model
 */

class Recommendation {
    constructor(data = {}) {
        this.id = data.id || null;
        this.type = data.type || ''; // DEADHEAD, RELAY, HOTEL, RESTART, BREAK, GENERAL
        this.priority = data.priority || 'INFO'; // INFO, LOW, MEDIUM, HIGH, CRITICAL
        this.message = data.message || '';
        this.solution = data.solution || 'none'; // deadhead, relay, hotel, restart, break, none
        this.tripId = data.tripId || null;
        this.driverId = data.driverId || null;
        this.implemented = data.implemented || false;
        this.implementationNotes = data.implementationNotes || '';
        this.createdAt = data.createdAt || Date.now();
    }

    implement(notes = '') {
        this.implemented = true;
        this.implementationNotes = notes;
        this.implementedAt = Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            priority: this.priority,
            message: this.message,
            solution: this.solution,
            tripId: this.tripId,
            driverId: this.driverId,
            implemented: this.implemented,
            implementationNotes: this.implementationNotes,
            implementedAt: this.implementedAt,
            createdAt: this.createdAt
        };
    }
}

module.exports = Recommendation;
