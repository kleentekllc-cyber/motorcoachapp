/**
 * Driver.js
 * Driver data model
 */

class Driver {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.licenseNumber = data.licenseNumber || '';
        this.licenseType = data.licenseType || 'CDL-B'; // CDL-A, CDL-B, etc.
        this.driverType = data.driverType || 'full-time'; // full-time or part-time
        this.hosMode = data.hosMode || '70_8'; // 70_8 or 60_7
        this.status = data.status || 'active'; // active, inactive, suspended
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.hireDate = data.hireDate || null;
        this.assignedVehicleId = data.assignedVehicleId || null;
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    validate() {
        const errors = [];
        
        if (!this.name) errors.push('Name is required');
        if (!this.licenseNumber) errors.push('License number is required');
        if (!['full-time', 'part-time'].includes(this.driverType)) {
            errors.push('Driver type must be full-time or part-time');
        }
        if (!['70_8', '60_7'].includes(this.hosMode)) {
            errors.push('HOS mode must be 70_8 or 60_7');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            licenseNumber: this.licenseNumber,
            licenseType: this.licenseType,
            driverType: this.driverType,
            hosMode: this.hosMode,
            status: this.status,
            phone: this.phone,
            email: this.email,
            hireDate: this.hireDate,
            assignedVehicleId: this.assignedVehicleId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Driver;
