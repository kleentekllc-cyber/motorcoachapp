/**
 * Payment.js
 * Driver payment tracking model
 */

class Payment {
    constructor(data = {}) {
        this.id = data.id || null;
        this.driverId = data.driverId || null;
        this.tripId = data.tripId || null;
        this.driverType = data.driverType || 'full-time';
        this.payLabel = data.payLabel || '';
        this.basePay = data.basePay || 0;
        this.safetyBonus = data.safetyBonus || 0;
        this.deadheadPay = data.deadheadPay || 0;
        this.relayPay = data.relayPay || 0;
        this.tripShare = data.tripShare || 0;
        this.totalPay = data.totalPay || 0;
        this.payPeriodStart = data.payPeriodStart || null;
        this.payPeriodEnd = data.payPeriodEnd || null;
        this.status = data.status || 'pending'; // pending, approved, paid
        this.paidDate = data.paidDate || null;
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
    }

    approve() {
        this.status = 'approved';
        this.approvedAt = Date.now();
    }

    markPaid() {
        this.status = 'paid';
        this.paidDate = Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            driverId: this.driverId,
            tripId: this.tripId,
            driverType: this.driverType,
            payLabel: this.payLabel,
            basePay: this.basePay,
            safetyBonus: this.safetyBonus,
            deadheadPay: this.deadheadPay,
            relayPay: this.relayPay,
            tripShare: this.tripShare,
            totalPay: this.totalPay,
            payPeriodStart: this.payPeriodStart,
            payPeriodEnd: this.payPeriodEnd,
            status: this.status,
            approvedAt: this.approvedAt,
            paidDate: this.paidDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Payment;
