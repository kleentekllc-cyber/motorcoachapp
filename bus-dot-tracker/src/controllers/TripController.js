/**
 * TripController.js
 * Handles all trip-related operations
 */

class TripController {
    constructor(tripService, hosService) {
        this.tripService = tripService;
        this.hosService = hosService;
    }

    getAllTrips() {
        return this.tripService.getAllTrips();
    }

    getTripById(tripId) {
        return this.tripService.getTripById(tripId);
    }

    createTrip(tripData) {
        // Validate required fields
        if (!tripData.miles || !tripData.avgSpeedMph) {
            throw new Error('Miles and average speed are required');
        }

        // Run HOS validation
        const hosValidation = this.hosService.validateTrip(tripData);
        
        // Add validation results to trip
        tripData.hosStatus = hosValidation.status;
        tripData.violations = hosValidation.violations;
        tripData.recommendations = hosValidation.recommendations;

        return this.tripService.createTrip(tripData);
    }

    updateTrip(tripId, updateData) {
        // Re-validate HOS if trip parameters changed
        if (updateData.miles || updateData.avgSpeedMph || updateData.weeklyHoursUsed) {
            const trip = this.tripService.getTripById(tripId);
            const mergedData = { ...trip, ...updateData };
            const hosValidation = this.hosService.validateTrip(mergedData);
            
            updateData.hosStatus = hosValidation.status;
            updateData.violations = hosValidation.violations;
            updateData.recommendations = hosValidation.recommendations;
        }

        return this.tripService.updateTrip(tripId, updateData);
    }

    deleteTrip(tripId) {
        return this.tripService.deleteTrip(tripId);
    }

    getTripsByDate(date) {
        return this.tripService.getTripsByDate(date);
    }

    getTripsByDriver(driverId) {
        return this.tripService.getTripsByDriver(driverId);
    }

    getTripsByVehicle(vehicleId) {
        return this.tripService.getTripsByVehicle(vehicleId);
    }

    calculateTripTimeline(tripId) {
        const trip = this.tripService.getTripById(tripId);
        if (!trip) {
            throw new Error('Trip not found');
        }

        return this.hosService.generateTimeline(trip);
    }
}

module.exports = TripController;
