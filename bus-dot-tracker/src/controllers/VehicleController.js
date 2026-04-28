/**
 * VehicleController.js
 * Handles all vehicle-related operations
 */

class VehicleController {
    constructor(vehicleService) {
        this.vehicleService = vehicleService;
    }

    getAllVehicles() {
        return this.vehicleService.getAllVehicles();
    }

    getVehicleById(vehicleId) {
        return this.vehicleService.getVehicleById(vehicleId);
    }

    createVehicle(vehicleData) {
        if (!vehicleData.vehicleId || !vehicleData.capacity) {
            throw new Error('Vehicle ID and capacity are required');
        }
        return this.vehicleService.createVehicle(vehicleData);
    }

    updateVehicle(vehicleId, updateData) {
        return this.vehicleService.updateVehicle(vehicleId, updateData);
    }

    deleteVehicle(vehicleId) {
        return this.vehicleService.deleteVehicle(vehicleId);
    }

    getVehicleMaintenanceStatus(vehicleId) {
        return this.vehicleService.getVehicleMaintenanceStatus(vehicleId);
    }

    assignDriverToVehicle(vehicleId, driverId) {
        return this.vehicleService.assignDriverToVehicle(vehicleId, driverId);
    }

    getVehicleTrips(vehicleId) {
        return this.vehicleService.getVehicleTrips(vehicleId);
    }
}

module.exports = VehicleController;
