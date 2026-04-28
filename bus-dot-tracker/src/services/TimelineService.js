/**
 * TimelineService.js
 * Generates trip timelines and segments
 */

class TimelineService {
    generateTimeline(tripData) {
        const segments = this.calculateSegments(tripData);
        const timeline = [];
        let currentTime = new Date(tripData.startTime || Date.now());

        segments.forEach(segment => {
            timeline.push({
                time: new Date(currentTime),
                type: segment.type,
                duration: segment.duration,
                icon: segment.icon,
                label: segment.label
            });
            currentTime = new Date(currentTime.getTime() + segment.duration * 60 * 60 * 1000);
        });

        return {
            timeline,
            totalDuration: segments.reduce((sum, s) => sum + s.duration, 0),
            segments
        };
    }

    calculateSegments(tripData) {
        const segments = [];
        const {
            miles,
            avgSpeedMph,
            preTripMinutes = 15,
            postTripMinutes = 15,
            stopMinutes = 0,
            serviceTaskMinutes = 0,
            deadheadMiles = 0,
            deadheadSpeedMph = 60
        } = tripData;

        // Pre-trip
        if (preTripMinutes > 0) {
            segments.push({
                type: "PRE_TRIP",
                duration: preTripMinutes / 60,
                icon: "🔧",
                label: "Pre-Trip Inspection",
                color: "#3B82F6"
            });
        }

        // Deadhead
        if (deadheadMiles > 0) {
            segments.push({
                type: "DEADHEAD",
                duration: deadheadMiles / deadheadSpeedMph,
                icon: "🚛",
                label: "Deadhead",
                color: "#6B7280"
            });
        }

        // Driving
        segments.push({
            type: "DRIVE",
            duration: miles / avgSpeedMph,
            icon: "🚗",
            label: "Driving",
            color: "#EF4444"
        });

        // Stops
        if (stopMinutes > 0) {
            segments.push({
                type: "STOP",
                duration: stopMinutes / 60,
                icon: "⏸️",
                label: "Passenger Stops",
                color: "#F59E0B"
            });
        }

        // Service tasks
        if (serviceTaskMinutes > 0) {
            segments.push({
                type: "SERVICE",
                duration: serviceTaskMinutes / 60,
                icon: "⛽",
                label: "Dump/Fuel/Clean",
                color: "#8B5CF6"
            });
        }

        // Post-trip
        if (postTripMinutes > 0) {
            segments.push({
                type: "POST_TRIP",
                duration: postTripMinutes / 60,
                icon: "🔧",
                label: "Post-Trip Inspection",
                color: "#3B82F6"
            });
        }

        return segments;
    }

    generateHorizontalBar(tripData) {
        const segments = this.calculateSegments(tripData);
        const totalMinutes = segments.reduce((sum, s) => sum + s.duration * 60, 0);

        return segments.map(segment => ({
            ...segment,
            widthPercent: (segment.duration * 60 / totalMinutes) * 100
        }));
    }

    getTimelineByTripId(tripId) {
        // This would fetch from database in production
        return null;
    }
}

module.exports = TimelineService;
