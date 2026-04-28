/**
 * TimelineController.js
 * Handles trip timeline generation and visualization
 */

class TimelineController {
    constructor(timelineService) {
        this.timelineService = timelineService;
    }

    generateTripTimeline(tripData) {
        return this.timelineService.generateTimeline(tripData);
    }

    generateHorizontalBar(tripData) {
        return this.timelineService.generateHorizontalBar(tripData);
    }

    calculateSegments(tripData) {
        return this.timelineService.calculateSegments(tripData);
    }

    getTimelineByTripId(tripId) {
        return this.timelineService.getTimelineByTripId(tripId);
    }
}

module.exports = TimelineController;
