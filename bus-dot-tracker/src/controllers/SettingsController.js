/**
 * SettingsController.js
 * Handles system settings and configuration
 */

class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }

    getCompanyInfo() {
        return this.settingsService.getCompanyInfo();
    }

    updateCompanyInfo(companyData) {
        return this.settingsService.updateCompanyInfo(companyData);
    }

    getMaintenanceSettings() {
        return this.settingsService.getMaintenanceSettings();
    }

    updateMaintenanceSettings(maintenanceData) {
        return this.settingsService.updateMaintenanceSettings(maintenanceData);
    }

    getDOTSettings() {
        return this.settingsService.getDOTSettings();
    }

    updateDOTSettings(dotData) {
        return this.settingsService.updateDOTSettings(dotData);
    }

    getSafetyRules() {
        return this.settingsService.getSafetyRules();
    }

    updateSafetyRules(safetyData) {
        return this.settingsService.updateSafetyRules(safetyData);
    }

    getAllSettings() {
        return this.settingsService.getAllSettings();
    }
}

module.exports = SettingsController;
