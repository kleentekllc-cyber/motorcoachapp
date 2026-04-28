/**
 * DriverController.js
 * Handles all driver-related operations
 */

class DriverController {
    constructor(driverService) {
        this.driverService = driverService;
    }

    /**
     * Get all drivers
     * @returns {Array} List of all drivers
     */
    getAllDrivers() {
        return this.driverService.getAllDrivers();
    }

    /**
     * Get driver by ID
     * @param {number} driverId - Driver ID
     * @returns {Object|null} Driver object or null if not found
     */
    getDriverById(driverId) {
        return this.driverService.getDriverById(driverId);
    }

    /**
     * Create new driver
     * @param {Object} driverData - Driver information
     * @returns {Object} Created driver with ID
     */
    createDriver(driverData) {
        // Validate required fields
        if (!driverData.name || !driverData.licenseNumber) {
            throw new Error('Name and license number are required');
        }

        return this.driverService.createDriver(driverData);
    }

    /**
     * Update existing driver
     * @param {number} driverId - Driver ID
     * @param {Object} updateData - Updated driver information
     * @returns {Object} Updated driver
     */
    updateDriver(driverId, updateData) {
        return this.driverService.updateDriver(driverId, updateData);
    }

    /**
     * Delete driver
     * @param {number} driverId - Driver ID
     * @returns {boolean} Success status
     */
    deleteDriver(driverId) {
        return this.driverService.deleteDriver(driverId);
    }

    /**
     * Get driver's current HOS status
     * @param {number} driverId - Driver ID
     * @returns {Object} Current HOS status
     */
    getDriverHOSStatus(driverId) {
        return this.driverService.getDriverHOSStatus(driverId);
    }

    /**
     * Get driver's assigned trips
     * @param {number} driverId - Driver ID
     * @returns {Array} List of assigned trips
     */
    getDriverTrips(driverId) {
        return this.driverService.getDriverTrips(driverId);
    }

    /**
     * Assign driver to trip
     * @param {number} driverId - Driver ID
     * @param {number} tripId - Trip ID
     * @returns {Object} Assignment result
     */
    assignDriverToTrip(driverId, tripId) {
        return this.driverService.assignDriverToTrip(driverId, tripId);
    }

    /**
     * Update driver status
     * @param {number} driverId - Driver ID
     * @param {string} status - New status (driving, on-duty, off-duty)
     * @returns {Object} Updated status
     */
    updateDriverStatus(driverId, status) {
        const validStatuses = ['driving', 'on-duty', 'off-duty', 'sleeper'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid driver status');
        }

        return this.driverService.updateDriverStatus(driverId, status);
    }
}

module.exports = DriverController;
