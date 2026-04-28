/**
 * Vehicle.js
 * Vehicle data model
 */

class Vehicle {
    constructor(data = {}) {
        this.id = data.id || null;
        this.vehicleId = data.vehicleId || '';
        this.type = data.type || 'motorcoach'; // motorcoach, van, sedan, suv
        this.capacity = data.capacity || 0;
        this.make = data.make || '';
        this.model = data.model || '';
        this.year = data.year || null;
        this.vin = data.vin || '';
        this.licensePlate = data.licensePlate || '';
        this.mileage = data.mileage || 0;
        this.status = data.status || 'available'; // available, in-use, maintenance, out-of-service
        this.lastMaintenanceDate = data.lastMaintenanceDate || null;
        this.nextMaintenanceDate = data.nextMaintenanceDate || null;
        this.nextMaintenanceMiles = data.nextMaintenanceMiles || null;
        this.assignedDriverId = data.assignedDriverId || null;
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    validate() {
        const errors = [];
        
        if (!this.vehicleId) errors.push('Vehicle ID is required');
        if (this.capacity <= 0) errors.push('Capacity must be greater than 0');
        if (!['motorcoach', 'van', 'sedan', 'suv'].includes(this.type)) {
            errors.push('Invalid vehicle type');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    needsMaintenance() {
        const now = Date.now();
        const maintenanceDue = this.nextMaintenanceDate && now >= this.nextMaintenanceDate;
        const mileageDue = this.nextMaintenanceMiles && this.mileage >= this.nextMaintenanceMiles;
        
        return maintenanceDue || mileageDue;
    }

    toJSON() {
        return {
            id: this.id,
            vehicleId: this.vehicleId,
            type: this.type,
            capacity: this.capacity,
            make: this.make,
            model: this.model,
            year: this.year,
            vin: this.vin,
            licensePlate: this.licensePlate,
            mileage: this.mileage,
            status: this.status,
            lastMaintenanceDate: this.lastMaintenanceDate,
            nextMaintenanceDate: this.nextMaintenanceDate,
            nextMaintenanceMiles: this.nextMaintenanceMiles,
            assignedDriverId: this.assignedDriverId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Vehicle;
