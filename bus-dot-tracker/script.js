// DOT Hours Tracker for Bus Drivers
// Regulations: 10hr driving, 15hr on-duty, 30min break, 70hr/7-day or 70hr/8-day

let currentStatus = 'off-duty';
let statusStartTime = null;
let updateInterval = null;

// Hours tracking
let drivingHours = 0;
let onDutyHours = 0;
let weeklyHours = 0;
let timeSinceLastBreak = 0;
let lastBreakTime = null;

// HOS Mode
let hosMode = '70_8'; // Default to 70hr/8-day

// Log entries
let logEntries = [];

// Multi-trip tracking
let trips = [];
let restPeriods = [];
let editingTripId = null; // Track which trip is being edited
let tripStops = []; // Track multiple stops for a trip
let stopCounter = 0; // Counter for stop IDs

// Constants
const MAX_DRIVING_HOURS = 10;
const MAX_DUTY_HOURS = 15;
const BREAK_REQUIRED_AFTER = 8; // hours
const BREAK_DURATION = 0.5; // 30 minutes
const RESTART_HOURS = 34; // 34-hour restart

// Compensation Constants
const FULL_TIME_PAY_TABLE = [
    {
        jobType: "Contract/Flat",
        weeklySalary: 400,
        baseRatePercent: 12,
        gratuityPercent: null,
        safetyBonusPercent: 4,
        totalTripRevenuePercent: 16
    },
    {
        jobType: "Retail with Gratuity",
        weeklySalary: 400,
        baseRatePercent: null,
        gratuityPercent: 20,
        safetyBonusPercent: 4,
        totalTripRevenuePercent: 24
    }
];

const PART_TIME_PAY_TABLE = [
    {
        vehicleType: "Sedan/SUV Retail",
        baseRatePercent: 10,
        gratuityPercent: 20,
        safetyBonusPercent: 4,
        totalTripRevenuePercent: 34
    },
    {
        vehicleType: "Van-Motorcoach Retail",
        baseRatePercent: 8,
        gratuityPercent: 20,
        safetyBonusPercent: 4,
        totalTripRevenuePercent: 32
    },
    {
        vehicleType: "Half Day / Flat or Contract (≤6 hrs)",
        flatRate: 150,
        gratuityPercent: null,
        safetyBonusFlat: 50,
        totalPayFlat: 200
    },
    {
        vehicleType: "Full Day / Flat or Contract (>6 hrs)",
        flatRate: 275,
        gratuityPercent: null,
        safetyBonusFlat: 50,
        totalPayFlat: 325
    }
];

// Legacy constants for backward compatibility
const WEEKLY_SALARY = 400;
const CONTRACT_BASE_RATE = 0.12;
const CONTRACT_SAFETY_BONUS = 0.04;
const CONTRACT_TOTAL_RATE = 0.16;
const RETAIL_GRATUITY_RATE = 0.20;
const RETAIL_SAFETY_BONUS = 0.04;
const RETAIL_TOTAL_RATE = 0.24;

const DEADHEAD_PAY_TABLE = [
    {
        duration: "Under 4 hours",
        basePay: 50,
        safetyBonus: 50,
        total: 100
    },
    {
        duration: "Under 8 hours",
        basePay: 150,
        safetyBonus: 50,
        total: 200
    },
    {
        duration: "Over 9 hours",
        basePay: 250,
        safetyBonus: 50,
        total: 300
    }
];

const RELAY_PAY_TABLE = [
    {
        duration: "Under 6 hours",
        basePay: 150,
        safetyBonus: 50,
        total: 200
    },
    {
        duration: "Over 6 hours",
        basePay: 275,
        safetyBonus: 50,
        total: 325
    }
];

// Legacy format for backward compatibility with existing code
const DEADHEAD_PAY = [
    { maxHours: 4, base: 50, bonus: 50 },
    { maxHours: 8, base: 150, bonus: 50 },
    { maxHours: Infinity, base: 250, bonus: 50 }
];

const RELAY_PAY = [
    { maxHours: 6, base: 150, bonus: 50 },
    { maxHours: Infinity, base: 275, bonus: 50 }
];

// Map variables
let map;
let startMarker = null;
let endMarker = null;
let routeLine = null;
let clickCount = 0;
let destinationCount = 0;
let additionalDestinations = [];

// Calculate deadhead bonus based on hours
function calculateDeadheadBonus(hours) {
    for (const tier of DEADHEAD_PAY) {
        if (hours <= tier.maxHours) {
            return tier.base + tier.bonus;
        }
    }
    return 0;
}

// Calculate relay bonus based on hours
function calculateRelayBonus(hours) {
    for (const tier of RELAY_PAY) {
        if (hours <= tier.maxHours) {
            return tier.base + tier.bonus;
        }
    }
    return 0;
}

// Calculate trip revenue share
function calculateTripRevenueShare(tripType, revenue, isSafetyEligible) {
    if (tripType === 'contract') {
        const rate = CONTRACT_BASE_RATE + (isSafetyEligible ? CONTRACT_SAFETY_BONUS : 0);
        return revenue * rate;
    } else {
        const rate = RETAIL_GRATUITY_RATE + (isSafetyEligible ? RETAIL_SAFETY_BONUS : 0);
        return revenue * rate;
    }
}

// Calculate total pay for a trip including weekly salary
function calculateTotalPay(inputs) {
    const {
        tripType,
        tripRevenue,
        includesDeadhead,
        deadheadDurationHours,
        includesRelay,
        relayDurationHours,
        isSafetyEligible
    } = inputs;
    
    const baseSalary = WEEKLY_SALARY;
    const tripShare = calculateTripRevenueShare(tripType, tripRevenue, isSafetyEligible);
    const deadheadBonus = includesDeadhead ? calculateDeadheadBonus(deadheadDurationHours) : 0;
    const relayBonus = includesRelay ? calculateRelayBonus(relayDurationHours) : 0;
    
    return baseSalary + tripShare + deadheadBonus + relayBonus;
}

// Calculate trip pay
function calculateTripPay(tripPayInputs) {
    const {
        driverType,
        tripType,
        vehicleType,
        tripRevenue,
        tripDurationHours,
        includesDeadhead,
        deadheadDurationHours,
        includesRelay,
        relayDurationHours,
        isSafetyEligible
    } = tripPayInputs;
    
    let basePay = 0;
    let safetyBonus = 0;
    let deadheadPay = 0;
    let relayPay = 0;
    let payLabel = '';
    
    // Calculate based on driver type
    if (driverType === 'full-time') {
        // Full-time driver calculation
        if (tripType === 'contract') {
            basePay = tripRevenue * CONTRACT_BASE_RATE;
            payLabel = 'Base Pay (12%)';
            if (isSafetyEligible) {
                safetyBonus = tripRevenue * CONTRACT_SAFETY_BONUS;
            }
        } else if (tripType === 'retail') {
            basePay = tripRevenue * RETAIL_GRATUITY_RATE;
            payLabel = 'Gratuity (20%)';
            if (isSafetyEligible) {
                safetyBonus = tripRevenue * RETAIL_SAFETY_BONUS;
            }
        }
    } else if (driverType === 'part-time') {
        // Part-time driver calculation
        if (vehicleType === 'sedan-suv') {
            basePay = tripRevenue * 0.10; // 10% base
            const gratuity = tripRevenue * 0.20; // 20% gratuity
            basePay += gratuity;
            payLabel = 'Base+Gratuity (30%)';
            if (isSafetyEligible) {
                safetyBonus = tripRevenue * 0.04;
            }
        } else if (vehicleType === 'van-motorcoach') {
            basePay = tripRevenue * 0.08; // 8% base
            const gratuity = tripRevenue * 0.20; // 20% gratuity
            basePay += gratuity;
            payLabel = 'Base+Gratuity (28%)';
            if (isSafetyEligible) {
                safetyBonus = tripRevenue * 0.04;
            }
        } else if (vehicleType === 'half-day') {
            basePay = 150; // Flat rate
            payLabel = 'Half Day Flat Rate';
            if (isSafetyEligible) {
                safetyBonus = 50;
            }
        } else if (vehicleType === 'full-day') {
            basePay = 275; // Flat rate
            payLabel = 'Full Day Flat Rate';
            if (isSafetyEligible) {
                safetyBonus = 50;
            }
        }
    }
    
    // Calculate deadhead pay if applicable
    if (includesDeadhead && deadheadDurationHours > 0) {
        deadheadPay = calculateDeadheadBonus(deadheadDurationHours);
        // Note: Safety bonus already included in calculateDeadheadBonus
    }
    
    // Calculate relay pay if applicable
    if (includesRelay && relayDurationHours > 0) {
        relayPay = calculateRelayBonus(relayDurationHours);
        // Note: Safety bonus already included in calculateRelayBonus
    }
    
    // Calculate total pay
    const tripShare = basePay + safetyBonus;
    const totalTripPay = tripShare + deadheadPay + relayPay;
    
    return {
        driverType: driverType,
        payLabel: payLabel,
        basePay: basePay.toFixed(2),
        safetyBonus: safetyBonus.toFixed(2),
        deadheadPay: deadheadPay.toFixed(2),
        relayPay: relayPay.toFixed(2),
        tripShare: tripShare.toFixed(2),
        totalPay: totalTripPay.toFixed(2)
    };
}

// Get max weekly hours based on mode
function getMaxWeeklyHours() {
    return 70; // Both modes use 70 hours
}

// Get period days based on mode
function getPeriodDays() {
    return hosMode === '70_7' ? 7 : 8;
}

// Toggle driver type fields (for trip planner)
function toggleDriverType() {
    const driverType = document.getElementById('driver_type').value;
    const fullTimeGroup = document.getElementById('fullTimeTypeGroup');
    const partTimeGroup = document.getElementById('partTimeVehicleGroup');
    
    if (driverType === 'full-time') {
        fullTimeGroup.classList.remove('hidden');
        partTimeGroup.classList.add('hidden');
    } else {
        fullTimeGroup.classList.add('hidden');
        partTimeGroup.classList.remove('hidden');
    }
}

// Toggle driver type fields (for pay calculator)
function togglePayCalcType() {
    const driverType = document.getElementById('pay_driverType').value;
    const fullTimeGroup = document.getElementById('payFullTimeGroup');
    const partTimeGroup = document.getElementById('payPartTimeGroup');
    
    if (driverType === 'full-time') {
        fullTimeGroup.classList.remove('hidden');
        partTimeGroup.classList.add('hidden');
    } else {
        fullTimeGroup.classList.add('hidden');
        partTimeGroup.classList.remove('hidden');
    }
}

// Check if flat rate selected (for part-time)
function checkFlatRate() {
    const vehicleType = document.getElementById('pay_vehicleType').value;
    const revenueGroup = document.getElementById('payRevenueGroup');
    
    if (vehicleType === 'half-day' || vehicleType === 'full-day') {
        revenueGroup.classList.add('hidden');
    } else {
        revenueGroup.classList.remove('hidden');
    }
}

// Standalone pay calculator
function calculatePay() {
    const driverType = document.getElementById('pay_driverType').value;
    const tripType = document.getElementById('pay_tripType').value;
    const vehicleType = document.getElementById('pay_vehicleType').value;
    const revenue = parseFloat(document.getElementById('pay_revenue').value) || 0;
    const deadheadHours = parseFloat(document.getElementById('pay_deadheadHours').value) || 0;
    const relayHours = parseFloat(document.getElementById('pay_relayHours').value) || 0;
    const isSafety = document.getElementById('pay_safety').checked;
    
    // Validate inputs based on driver type
    if (driverType === 'full-time' && revenue <= 0) {
        alert('Please enter trip revenue for full-time drivers.');
        return;
    }
    
    if (driverType === 'part-time') {
        if ((vehicleType === 'sedan-suv' || vehicleType === 'van-motorcoach') && revenue <= 0) {
            alert('Please enter trip revenue for retail trips.');
            return;
        }
    }
    
    // Calculate pay breakdown
    const payBreakdown = calculateTripPay({
        driverType: driverType,
        tripType: driverType === 'full-time' ? tripType : null,
        vehicleType: driverType === 'part-time' ? vehicleType : null,
        tripRevenue: revenue,
        tripDurationHours: 0,
        includesDeadhead: deadheadHours > 0,
        deadheadDurationHours: deadheadHours,
        includesRelay: relayHours > 0,
        relayDurationHours: relayHours,
        isSafetyEligible: isSafety
    });
    
    // Display results
    const resultsDiv = document.getElementById('payResults');
    const displayDiv = document.getElementById('payBreakdownDisplay');
    resultsDiv.classList.remove('hidden');
    
    let html = '<div class="pay-breakdown-grid">';
    
    // Driver type and job info
    html += `
        <div class="pay-info-card">
            <div class="pay-info-header">Driver Information</div>
            <div class="pay-info-row">
                <span>Driver Type:</span>
                <span><strong>${driverType === 'full-time' ? 'Full-Time' : 'Part-Time'}</strong></span>
            </div>
            ${driverType === 'full-time' ? `
            <div class="pay-info-row">
                <span>Trip Type:</span>
                <span><strong>${tripType === 'contract' ? 'Contract/Flat' : 'Retail with Gratuity'}</strong></span>
            </div>
            <div class="pay-info-row">
                <span>Weekly Salary:</span>
                <span><strong>$${WEEKLY_SALARY.toFixed(2)}</strong></span>
            </div>
            ` : `
            <div class="pay-info-row">
                <span>Vehicle Type:</span>
                <span><strong>${vehicleType === 'sedan-suv' ? 'Sedan/SUV' : vehicleType === 'van-motorcoach' ? 'Van-Motorcoach' : vehicleType === 'half-day' ? 'Half Day' : 'Full Day'}</strong></span>
            </div>
            <div class="pay-info-row">
                <span>Weekly Salary:</span>
                <span><strong>None (Part-Time)</strong></span>
            </div>
            `}
        </div>
        
        <div class="pay-breakdown-card">
            <div class="pay-breakdown-header">💰 Pay Breakdown</div>
            ${revenue > 0 || vehicleType === 'half-day' || vehicleType === 'full-day' ? `
            <div class="pay-breakdown-row">
                <span>${payBreakdown.payLabel}:</span>
                <span class="pay-amount">$${payBreakdown.basePay}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.safetyBonus) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Safety/Compliance Bonus:</span>
                <span class="pay-amount">$${payBreakdown.safetyBonus}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.deadheadPay) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Deadhead Pay (${deadheadHours.toFixed(1)}h):</span>
                <span class="pay-amount">$${payBreakdown.deadheadPay}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.relayPay) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Relay Pay (${relayHours.toFixed(1)}h):</span>
                <span class="pay-amount">$${payBreakdown.relayPay}</span>
            </div>
            ` : ''}
            <div class="pay-breakdown-row total">
                <span><strong>${driverType === 'full-time' ? 'Trip Total:' : 'Total Pay:'}</strong></span>
                <span class="pay-amount"><strong>$${payBreakdown.totalPay}</strong></span>
            </div>
            ${driverType === 'full-time' ? `
            <div class="pay-breakdown-row grand-total">
                <span><strong>With Weekly Salary:</strong></span>
                <span class="pay-amount"><strong>$${(parseFloat(payBreakdown.totalPay) + WEEKLY_SALARY).toFixed(2)}</strong></span>
            </div>
            ` : ''}
        </div>
    `;
    
    html += '</div>';
    displayDiv.innerHTML = html;
}

// Update garage time and spot time displays when pickup time changes
function updateGarageTimeDisplay() {
    const pickupTime = document.getElementById('trip_pickupTime').value;
    const garageTimeField = document.getElementById('trip_garageTime');
    const spotTimeField = document.getElementById('trip_spotTime_display');
    
    if (pickupTime) {
        const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
        const pickupMinutes = pickupHour * 60 + pickupMinute;
        
        // Calculate garage time (1 hour before pickup)
        const garageMinutes = pickupMinutes - 60;
        let garageHour = Math.floor(garageMinutes / 60);
        let garageMin = garageMinutes % 60;
        
        if (garageMinutes < 0) {
            // Previous day
            const totalMins = 1440 + garageMinutes;
            garageHour = Math.floor(totalMins / 60);
            garageMin = totalMins % 60;
            garageTimeField.value = `${String(garageHour).padStart(2, '0')}:${String(garageMin).padStart(2, '0')} (prev day)`;
        } else {
            garageTimeField.value = `${String(garageHour).padStart(2, '0')}:${String(garageMin).padStart(2, '0')}`;
        }
        
        // Calculate spot time (15 minutes before pickup)
        const spotMinutes = pickupMinutes - 15;
        let spotHour = Math.floor(spotMinutes / 60);
        let spotMin = spotMinutes % 60;
        
        if (spotMinutes < 0) {
            // Previous day
            const totalMins = 1440 + spotMinutes;
            spotHour = Math.floor(totalMins / 60);
            spotMin = totalMins % 60;
            spotTimeField.value = `${String(spotHour).padStart(2, '0')}:${String(spotMin).padStart(2, '0')} (prev day)`;
        } else {
            spotTimeField.value = `${String(spotHour).padStart(2, '0')}:${String(spotMin).padStart(2, '0')}`;
        }
    } else {
        garageTimeField.value = '';
        spotTimeField.value = '';
    }
    
    // Also update return times when pickup time changes
    calculateReturnTimes();
}

// Calculate trip duration based on times entered
function calculateTripDuration() {
    const pickupTime = document.getElementById('trip_pickupTime')?.value;
    const dropoffTime = document.getElementById('trip_dropoffTime')?.value;
    const returnPickupTime = document.getElementById('trip_returnPickupTime')?.value;
    const returnDropoffTime = document.getElementById('trip_returnDropoffTime')?.value;
    const durationField = document.getElementById('trip_duration');
    
    if (!durationField) return;
    
    // If return times are filled, it's a multi-day trip
    if (returnPickupTime && returnDropoffTime && pickupTime && dropoffTime) {
        // Multi-day trip - calculate based on typical charter patterns
        // Assumption: Leave on Day 1, arrive Day 1 evening, stay X days, return on last day
        
        // Simple calculation: if return times exist, minimum is 2 days
        // User can adjust if they stayed longer
        const currentDuration = parseInt(durationField.value) || 2;
        
        // Auto-set to 2 days minimum for round trips
        if (currentDuration < 2) {
            durationField.value = '2';
            durationField.style.background = '#f0f9ff';
            durationField.title = 'Auto-calculated (2 days minimum for round trip)';
        }
    } else if (pickupTime && dropoffTime && !returnPickupTime && !returnDropoffTime) {
        // One-way trip - single day
        durationField.value = '1';
        durationField.style.background = '#f0f9ff';
        durationField.title = 'Auto-calculated (one-way trip)';
    }
}

// Legacy function kept for compatibility
function calculateReturnTimes() {
    calculateTripDuration();
}

// Calculate total trip hours from pickup to return drop-off
function calculateTotalTripHours() {
    const pickupTime = document.getElementById('trip_pickupTime')?.value;
    const dropoffTime = document.getElementById('trip_dropoffTime')?.value;
    const returnPickupTime = document.getElementById('trip_returnPickupTime')?.value;
    const returnDropoffTime = document.getElementById('trip_returnDropoffTime')?.value;
    const totalHoursField = document.getElementById('trip_totalHours');
    
    if (!totalHoursField) return;
    
    // Calculate hours based on what times are available
    if (pickupTime && returnDropoffTime) {
        // Full round trip calculation
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [returnDropHour, returnDropMin] = returnDropoffTime.split(':').map(Number);
        
        let pickupMinutes = pickupHour * 60 + pickupMin;
        let returnDropMinutes = returnDropHour * 60 + returnDropMin;
        
        // Handle overnight trips
        if (returnDropMinutes < pickupMinutes) {
            returnDropMinutes += (24 * 60); // Add 24 hours for next day
        }
        
        const totalMinutes = returnDropMinutes - pickupMinutes;
        const totalHours = totalMinutes / 60;
        
        totalHoursField.value = `${totalHours.toFixed(2)} hours`;
    } else if (pickupTime && dropoffTime) {
        // One-way trip calculation
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [dropHour, dropMin] = dropoffTime.split(':').map(Number);
        
        let pickupMinutes = pickupHour * 60 + pickupMin;
        let dropMinutes = dropHour * 60 + dropMin;
        
        // Handle overnight
        if (dropMinutes < pickupMinutes) {
            dropMinutes += (24 * 60);
        }
        
        const totalMinutes = dropMinutes - pickupMinutes;
        const totalHours = totalMinutes / 60;
        
        totalHoursField.value = `${totalHours.toFixed(2)} hours`;
    } else {
        totalHoursField.value = '';
    }
}

// Calculate HOS Trip
function calculateHOSTrip() {
    const startDate = document.getElementById('hosStartDate').value;
    const startTime = document.getElementById('hosStartTime').value;
    const miles = parseFloat(document.getElementById('hosMiles').value);
    const avgSpeed = parseFloat(document.getElementById('hosAvgSpeed').value);
    const preTrip = parseFloat(document.getElementById('hosPreTrip').value) || 0;
    const postTrip = parseFloat(document.getElementById('hosPostTrip').value) || 0;
    const stops = parseFloat(document.getElementById('hosStops').value) || 0;
    const weeklyUsed = parseFloat(document.getElementById('hosWeeklyUsed').value) || 0;
    const driverType = document.getElementById('hosDriverType').value;
    
    if (!startDate || !startTime) {
        alert('Please enter start date and time.');
        return;
    }
    
    if (!miles || miles <= 0 || !avgSpeed || avgSpeed <= 0) {
        alert('Please enter valid distance and average speed.');
        return;
    }
    
    // Calculate times
    const drivingHours = miles / avgSpeed;
    const dumpFuel = parseFloat(document.getElementById('hosDumpFuel').value) || 0;
    const onDutyHours = drivingHours + (preTrip + stops + dumpFuel + postTrip) / 60;
    
    // Calculate arrival time
    const startDateTime = new Date(startDate + 'T' + startTime);
    const arrivalDateTime = new Date(startDateTime.getTime() + (onDutyHours * 60 * 60 * 1000));
    
    // Determine status
    let status = 'LEGAL';
    let statusColor = '#10B981';
    const maxWeekly = getMaxWeeklyHours();
    
    if (drivingHours > 10) {
        status = 'EXCEEDS DRIVING LIMIT';
        statusColor = '#EF4444';
    } else if (onDutyHours > 15) {
        status = 'EXCEEDS ON-DUTY LIMIT';
        statusColor = '#EF4444';
    } else if (weeklyUsed + onDutyHours > maxWeekly) {
        status = 'EXCEEDS WEEKLY LIMIT';
        statusColor = '#F59E0B';
    } else if (drivingHours > 8 || onDutyHours > 12) {
        status = 'APPROACHING LIMITS';
        statusColor = '#F59E0B';
    }
    
    // Update Status Banner
    const statusBanner = document.getElementById('hosStatusBanner');
    const bannerIcon = document.getElementById('statusBannerIcon');
    const bannerTitle = document.getElementById('statusBannerTitle');
    const bannerSubtitle = document.getElementById('statusBannerSubtitle');
    
    if (status === 'LEGAL') {
        statusBanner.className = 'hos-status-banner legal';
        bannerIcon.textContent = '✅';
        bannerTitle.textContent = 'LEGAL';
        bannerTitle.style.color = '#047857';
        bannerSubtitle.textContent = 'Trip complies with all DOT HOS regulations';
        bannerSubtitle.style.color = '#065F46';
    } else if (status === 'APPROACHING LIMITS') {
        statusBanner.className = 'hos-status-banner warning';
        bannerIcon.textContent = '⚠️';
        bannerTitle.textContent = 'WARNING';
        bannerTitle.style.color = '#92400E';
        bannerSubtitle.textContent = 'Trip is approaching DOT limits - minimal buffer';
        bannerSubtitle.style.color = '#78350F';
    } else {
        statusBanner.className = 'hos-status-banner illegal';
        bannerIcon.textContent = '❌';
        bannerTitle.textContent = status.includes('WEEKLY') ? 'WEEKLY LIMIT' : 'ILLEGAL';
        bannerTitle.style.color = '#991B1B';
        bannerSubtitle.textContent = 'Trip exceeds DOT HOS regulations';
        bannerSubtitle.style.color = '#7F1D1D';
    }
    
    // Calculate hours remaining
    const remainingDriving = Math.max(0, 10 - drivingHours);
    const remainingDuty = Math.max(0, 15 - onDutyHours);
    const remainingWeekly = Math.max(0, maxWeekly - (weeklyUsed + onDutyHours));
    
    document.getElementById('remainingDriving').textContent = formatHours(remainingDriving);
    document.getElementById('remainingDuty').textContent = formatHours(remainingDuty);
    document.getElementById('remainingWeekly').textContent = formatHours(remainingWeekly);
    document.getElementById('resArrivalTime').textContent = arrivalDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Update remaining bars
    const drivingUsedPercent = (drivingHours / 10) * 100;
    const dutyUsedPercent = (onDutyHours / 15) * 100;
    const weeklyUsedPercent = ((weeklyUsed + onDutyHours) / maxWeekly) * 100;
    
    document.getElementById('remainingDrivingBar').style.width = Math.min(100, drivingUsedPercent) + '%';
    document.getElementById('remainingDutyBar').style.width = Math.min(100, dutyUsedPercent) + '%';
    document.getElementById('remainingWeeklyBar').style.width = Math.min(100, weeklyUsedPercent) + '%';
    
    // Populate Violations Section
    const violationsSection = document.getElementById('violationsSection');
    const violationsList = document.getElementById('violationsList');
    let violationsHTML = '';
    let hasViolations = false;
    
    if (drivingHours > 10) {
        hasViolations = true;
        const excess = drivingHours - 10;
        violationsHTML += `
            <div class="violation-item">
                <div class="violation-icon">🚗</div>
                <div class="violation-text">
                    <strong>Driving Limit Exceeded</strong>
                    Trip requires ${formatHours(drivingHours)} of driving, which exceeds the 10-hour limit by ${formatHours(excess)}.
                </div>
            </div>
        `;
    }
    
    if (onDutyHours > 15) {
        hasViolations = true;
        const excess = onDutyHours - 15;
        violationsHTML += `
            <div class="violation-item">
                <div class="violation-icon">⏰</div>
                <div class="violation-text">
                    <strong>On-Duty Limit Exceeded</strong>
                    Trip requires ${formatHours(onDutyHours)} on-duty, which exceeds the 15-hour limit by ${formatHours(excess)}.
                </div>
            </div>
        `;
    }
    
    if (weeklyUsed + onDutyHours > maxWeekly) {
        hasViolations = true;
        const excess = (weeklyUsed + onDutyHours) - maxWeekly;
        violationsHTML += `
            <div class="violation-item">
                <div class="violation-icon">📅</div>
                <div class="violation-text">
                    <strong>Weekly Limit Exceeded</strong>
                    Trip would use ${formatHours(weeklyUsed + onDutyHours)} total, exceeding ${maxWeekly}-hour limit by ${formatHours(excess)}.
                </div>
            </div>
        `;
    }
    
    if (!hasViolations) {
        violationsSection.classList.add('no-violations');
        violationsSection.querySelector('h4').textContent = '✅ No Violations';
        violationsSection.querySelector('h4').style.color = '#10B981';
        violationsList.innerHTML = `
            <div class="violation-item" style="border-left-color: #10B981;">
                <div class="violation-icon">✅</div>
                <div class="violation-text">
                    All DOT HOS regulations are satisfied for this trip.
                </div>
            </div>
        `;
    } else {
        violationsSection.classList.remove('no-violations');
        violationsSection.querySelector('h4').textContent = '⚠️ Violations Detected';
        violationsSection.querySelector('h4').style.color = '#EF4444';
        violationsList.innerHTML = violationsHTML;
    }
    
    // Populate Recommendations
    generateHOSEngineRecommendations(drivingHours, onDutyHours, weeklyUsed, status, miles, avgSpeed);
    
    // Show results
    document.getElementById('hosResults').classList.remove('hidden');
    
    // Generate timeline
    generateTimeline(startDateTime, drivingHours, preTrip, stops, postTrip);
    
    // Generate recommendations
    generateRecommendations(drivingHours, onDutyHours, weeklyUsed, status, miles, avgSpeed);
    
    // Show sections
    document.getElementById('hosTimeline').classList.remove('hidden');
    document.getElementById('hosRecommendations').classList.remove('hidden');
}

// Generate timeline visualization with multiple segments
function generateTimeline(startDateTime, drivingHours, preTrip, stops, postTrip) {
    const timeline = document.getElementById('tripTimeline');
    const horizontalBar = document.getElementById('horizontalTimelineBar');
    const dumpFuel = parseFloat(document.getElementById('hosDumpFuel').value) || 0;
    
    // Get deadhead info from HOS inputs (if available)
    const deadheadMiles = parseFloat(document.getElementById('trip_deadheadMiles')?.value) || 0;
    const deadheadSpeed = parseFloat(document.getElementById('trip_deadheadSpeed')?.value) || 60;
    const deadheadHours = deadheadMiles > 0 ? deadheadMiles / deadheadSpeed : 0;
    
    // Determine if relay or hotel needed
    const totalDrivingHours = drivingHours + deadheadHours;
    const needsRelay = totalDrivingHours > 10;
    const needsHotel = (drivingHours + (preTrip + stops + dumpFuel + postTrip) / 60) > 15;
    
    // Calculate total time including all segments
    let totalMinutes = preTrip + (drivingHours * 60) + stops + dumpFuel + postTrip;
    if (deadheadHours > 0) totalMinutes += deadheadHours * 60;
    if (needsRelay) totalMinutes += 30; // Relay handoff time
    if (needsHotel) totalMinutes += 10 * 60; // 10-hour hotel reset
    
    // Update legality zones based on actual driving time
    updateLegalityZones(totalDrivingHours);

    
    // Generate horizontal bar segments
    let barHTML = '';
    let currentTime = new Date(startDateTime);
    
    // Pre-Trip segment
    if (preTrip > 0) {
        const widthPercent = (preTrip / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-pretrip" style="width: ${widthPercent}%;" title="Pre-Trip Inspection">
                <div class="segment-icon">🔧</div>
                <div class="segment-label-text">Pre-Trip</div>
                <div class="segment-time">${preTrip}m</div>
            </div>
        `;
    }
    
    // Deadhead segment (if exists - shown before main trip)
    if (deadheadHours > 0) {
        const deadheadWidthPercent = ((deadheadHours * 60) / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-deadhead" style="width: ${deadheadWidthPercent}%;" title="Deadhead (Empty)">
                <div class="segment-icon">🚛</div>
                <div class="segment-label-text">Deadhead</div>
                <div class="segment-time">${formatHours(deadheadHours)}</div>
            </div>
        `;
    }
    
    // Driving segments
    const totalStopTime = stops + dumpFuel;
    if (totalStopTime > 0) {
        const segmentCount = (stops > 0 ? 1 : 0) + (dumpFuel > 0 ? 1 : 0) + 1;
        const driveSegmentHours = drivingHours / segmentCount;
        const driveSegmentMinutes = driveSegmentHours * 60;
        const driveWidthPercent = (driveSegmentMinutes / totalMinutes) * 100;
        
        // First driving segment
        barHTML += `
            <div class="timeline-segment segment-drive" style="width: ${driveWidthPercent}%;" title="Driving">
                <div class="segment-icon">🚗</div>
                <div class="segment-label-text">Drive</div>
                <div class="segment-time">${formatHours(driveSegmentHours)}</div>
            </div>
        `;
        
        // Passenger stops
        if (stops > 0) {
            const stopWidthPercent = (stops / totalMinutes) * 100;
            barHTML += `
                <div class="timeline-segment segment-stop" style="width: ${stopWidthPercent}%;" title="Passenger Stops">
                    <div class="segment-icon">⏸️</div>
                    <div class="segment-label-text">Stop</div>
                    <div class="segment-time">${stops}m</div>
                </div>
            `;
            
            // Second driving segment
            barHTML += `
                <div class="timeline-segment segment-drive" style="width: ${driveWidthPercent}%;" title="Driving">
                    <div class="segment-icon">🚗</div>
                    <div class="segment-label-text">Drive</div>
                    <div class="segment-time">${formatHours(driveSegmentHours)}</div>
                </div>
            `;
        }
        
        // Dump/Fuel/Clean
        if (dumpFuel > 0) {
            const dumpWidthPercent = (dumpFuel / totalMinutes) * 100;
            barHTML += `
                <div class="timeline-segment segment-dumpfuel" style="width: ${dumpWidthPercent}%;" title="Dump/Fuel/Clean">
                    <div class="segment-icon">⛽</div>
                    <div class="segment-label-text">Dump/<br>Fuel</div>
                    <div class="segment-time">${dumpFuel}m</div>
                </div>
            `;
            
            // Final driving segment
            barHTML += `
                <div class="timeline-segment segment-drive" style="width: ${driveWidthPercent}%;" title="Driving">
                    <div class="segment-icon">🚗</div>
                    <div class="segment-label-text">Drive</div>
                    <div class="segment-time">${formatHours(driveSegmentHours)}</div>
                </div>
            `;
        }
    } else {
        // Single continuous driving
        const driveWidthPercent = ((drivingHours * 60) / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-drive" style="width: ${driveWidthPercent}%;" title="Driving">
                <div class="segment-icon">🚗</div>
                <div class="segment-label-text">Drive</div>
                <div class="segment-time">${formatHours(drivingHours)}</div>
            </div>
        `;
    }
    
    // Relay segment (if needed)
    if (needsRelay) {
        const relayWidthPercent = (30 / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-relay" style="width: ${relayWidthPercent}%;" title="Driver Relay">
                <div class="segment-icon">🔄</div>
                <div class="segment-label-text">Relay</div>
                <div class="segment-time">30m</div>
            </div>
        `;
    }
    
    // Hotel Reset segment (if needed)
    if (needsHotel) {
        const hotelWidthPercent = (600 / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-hotel" style="width: ${hotelWidthPercent}%;" title="Hotel Reset">
                <div class="segment-icon">🏨</div>
                <div class="segment-label-text">Hotel<br>Reset</div>
                <div class="segment-time">10h</div>
            </div>
        `;
    }
    
    // Post-Trip segment
    if (postTrip > 0) {
        const widthPercent = (postTrip / totalMinutes) * 100;
        barHTML += `
            <div class="timeline-segment segment-posttrip" style="width: ${widthPercent}%;" title="Post-Trip Inspection">
                <div class="segment-icon">🔧</div>
                <div class="segment-label-text">Post-Trip</div>
                <div class="segment-time">${postTrip}m</div>
            </div>
        `;
    }
    
    horizontalBar.innerHTML = barHTML;
    
    // Generate detailed timeline list
    let html = '';
    currentTime = new Date(startDateTime);

    
    // Pre-trip inspection
    if (preTrip > 0) {
        html += `
            <div class="timeline-item" style="border-left-color: #3B82F6; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🔧 Pre-Trip Inspection</div>
                <div class="timeline-duration">${preTrip} minutes - Vehicle check</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (preTrip * 60 * 1000));
    }
    
    // Deadhead driving (if exists)
    if (deadheadHours > 0) {
        html += `
            <div class="timeline-item" style="border-left-color: #6B7280; background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🚛 Deadhead (Empty)</div>
                <div class="timeline-duration">${formatHours(deadheadHours)} - Repositioning to pickup</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (deadheadHours * 60 * 60 * 1000));
    }
    
    // Break driving into segments if there are stops or dump/fuel activities
    const totalStopTimeDetailed = stops + dumpFuel;
    
    if (totalStopTimeDetailed > 0) {
        // Split driving into multiple segments
        const segmentCount = (stops > 0 ? 1 : 0) + (dumpFuel > 0 ? 1 : 0) + 1;
        const driveSegmentHours = drivingHours / segmentCount;
        
        // First driving segment
        html += `
            <div class="timeline-item" style="border-left-color: #EF4444; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🚗 Driving - Segment 1</div>
                <div class="timeline-duration">${formatHours(driveSegmentHours)}</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (driveSegmentHours * 60 * 60 * 1000));
        
        // Passenger stops (if any)
        if (stops > 0) {
            html += `
                <div class="timeline-item" style="border-left-color: #F59E0B; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
                    <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-event">⏸️ Passenger Stops</div>
                    <div class="timeline-duration">${stops} minutes - Loading/unloading</div>
                </div>
            `;
            currentTime = new Date(currentTime.getTime() + (stops * 60 * 1000));
            
            // Second driving segment
            html += `
                <div class="timeline-item" style="border-left-color: #EF4444; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
                    <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-event">🚗 Driving - Segment 2</div>
                    <div class="timeline-duration">${formatHours(driveSegmentHours)}</div>
                </div>
            `;
            currentTime = new Date(currentTime.getTime() + (driveSegmentHours * 60 * 60 * 1000));
        }
        
        // Dump/Fuel/Clean (if any)
        if (dumpFuel > 0) {
            html += `
                <div class="timeline-item" style="border-left-color: #8B5CF6; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);">
                    <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-event">⛽ Dump/Fuel/Clean</div>
                    <div class="timeline-duration">${dumpFuel} minutes - Maintenance</div>
                </div>
            `;
            currentTime = new Date(currentTime.getTime() + (dumpFuel * 60 * 1000));
            
            // Final driving segment
            html += `
                <div class="timeline-item" style="border-left-color: #EF4444; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
                    <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-event">🚗 Driving - Final Segment</div>
                    <div class="timeline-duration">${formatHours(driveSegmentHours)}</div>
                </div>
            `;
            currentTime = new Date(currentTime.getTime() + (driveSegmentHours * 60 * 60 * 1000));
        }
    } else {
        // Single continuous driving segment
        html += `
            <div class="timeline-item" style="border-left-color: #EF4444; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🚗 Driving</div>
                <div class="timeline-duration">${formatHours(drivingHours)}</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (drivingHours * 60 * 60 * 1000));
    }
    
    // Post-trip inspection
    if (postTrip > 0) {
        html += `
            <div class="timeline-item" style="border-left-color: #3B82F6; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🔧 Post-Trip Inspection</div>
                <div class="timeline-duration">${postTrip} minutes - Final check</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (postTrip * 60 * 1000));
    }
    
    // Relay segment (if needed)
    if (needsRelay) {
        html += `
            <div class="timeline-item" style="border-left-color: #14B8A6; background: linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🔄 Driver Relay Handoff</div>
                <div class="timeline-duration">30 minutes - Driver switch required for compliance</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (30 * 60 * 1000));
    }
    
    // Hotel Reset segment (if needed)
    if (needsHotel) {
        html += `
            <div class="timeline-item" style="border-left-color: #EC4899; background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);">
                <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-event">🏨 Overnight Hotel Reset</div>
                <div class="timeline-duration">10 hours - Mandatory rest period for DOT compliance</div>
            </div>
        `;
        currentTime = new Date(currentTime.getTime() + (10 * 60 * 60 * 1000));
    }
    
    // Final arrival
    html += `
        <div class="timeline-item" style="border-left-color: #10B981; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);">
            <div class="timeline-time">${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="timeline-event">🏁 Trip Complete</div>
            <div class="timeline-duration">Ready for off-duty status</div>
        </div>
    `;
    
    timeline.innerHTML = html;
}

// Generate recommendations
function generateRecommendations(drivingHours, onDutyHours, weeklyUsed, status, miles, avgSpeed) {
    const recommendationsList = document.getElementById('hosRecommendationsList');
    const paySummary = document.getElementById('hosPaySummary');
    let html = '';
    
    if (status === 'LEGAL') {
        html += `
            <div class="recommendation-item">
                <span class="recommendation-icon">✅</span>
                <span class="recommendation-text">Trip is compliant with all DOT HOS regulations</span>
            </div>
        `;
        
        if (drivingHours >= 8) {
            html += `
                <div class="recommendation-item warning">
                    <span class="recommendation-icon">⚠️</span>
                    <span class="recommendation-text">30-minute break required after 8 hours of driving</span>
                </div>
            `;
        }
        
        html += `
            <div class="recommendation-item">
                <span class="recommendation-icon">💡</span>
                <span class="recommendation-text">After trip: 10-hour off-duty period required before next shift</span>
            </div>
        `;
    } else if (status.includes('EXCEEDS DRIVING')) {
        const excess = drivingHours - 10;
        const excessMiles = excess * avgSpeed;
        
        html += `
            <div class="recommendation-item danger">
                <span class="recommendation-icon">❌</span>
                <span class="recommendation-text">Trip exceeds 10-hour driving limit by ${formatHours(excess)}</span>
            </div>
            <div class="recommendation-item warning">
                <span class="recommendation-icon">🚛</span>
                <span class="recommendation-text"><strong>Deadhead Solution:</strong> Reposition bus ${excessMiles.toFixed(0)} miles closer day before</span>
            </div>
            <div class="recommendation-item warning">
                <span class="recommendation-icon">🔄</span>
                <span class="recommendation-text"><strong>Relay Solution:</strong> Switch drivers at ${(10 * avgSpeed).toFixed(0)} mile mark</span>
            </div>
        `;
    } else if (status.includes('EXCEEDS ON-DUTY')) {
        html += `
            <div class="recommendation-item danger">
                <span class="recommendation-icon">❌</span>
                <span class="recommendation-text">Trip exceeds 15-hour on-duty limit</span>
            </div>
            <div class="recommendation-item warning">
                <span class="recommendation-icon">🏨</span>
                <span class="recommendation-text"><strong>Hotel Solution:</strong> Schedule overnight stop mid-trip</span>
            </div>
            <div class="recommendation-item warning">
                <span class="recommendation-icon">🔄</span>
                <span class="recommendation-text"><strong>Relay Solution:</strong> Switch drivers to complete trip</span>
            </div>
        `;
    } else if (status.includes('WEEKLY')) {
        const remaining = getMaxWeeklyHours() - weeklyUsed;
        html += `
            <div class="recommendation-item warning">
                <span class="recommendation-icon">⚠️</span>
                <span class="recommendation-text">Trip would exceed ${getMaxWeeklyHours()}-hour weekly limit</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-icon">⏰</span>
                <span class="recommendation-text"><strong>34-Hour Restart Required:</strong> Only ${formatHours(remaining)} remaining this period</span>
            </div>
        `;
    } else if (status.includes('APPROACHING')) {
        html += `
            <div class="recommendation-item warning">
                <span class="recommendation-icon">⚠️</span>
                <span class="recommendation-text">Trip is close to DOT limits - minimal buffer remaining</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-icon">💡</span>
                <span class="recommendation-text">Consider building in extra time for delays or traffic</span>
            </div>
        `;
    }
    
    recommendationsList.innerHTML = html;
    
    // Pay summary (simplified for now)
    const estimatedPay = 150; // Placeholder
    paySummary.innerHTML = `
        <div class="pay-summary-item">
            <span class="pay-summary-label">Driving Time:</span>
            <span class="pay-summary-value">${formatHours(drivingHours)}</span>
        </div>
        <div class="pay-summary-item">
            <span class="pay-summary-label">On-Duty Time:</span>
            <span class="pay-summary-value">${formatHours(onDutyHours)}</span>
        </div>
        <div class="pay-summary-item">
            <span class="pay-summary-label">Distance:</span>
            <span class="pay-summary-value">${miles.toFixed(0)} mi</span>
        </div>
        <div class="pay-summary-item total">
            <span class="pay-summary-label">Est. Trip Pay:</span>
            <span class="pay-summary-value">Calculate in Pay Tab</span>
        </div>
    `;
}

// Show pay detail tab
function showPayTab(tabId) {
    // Hide all tabs
    document.getElementById('fullTimeDetail').classList.add('hidden');
    document.getElementById('partTimeDetail').classList.add('hidden');
    
    // Remove active from all buttons
    const buttons = document.querySelectorAll('.pay-tab');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabId).classList.remove('hidden');
    
    // Mark button as active
    event.target.classList.add('active');
}

// Select pay type (full-time or part-time)
function selectPayType(type) {
    const fullTimeBtn = document.getElementById('fullTimeBtn');
    const partTimeBtn = document.getElementById('partTimeBtn');
    const weeklySalaryCard = document.getElementById('weeklySalaryCard');
    const fullTimeRates = document.getElementById('fullTimeRates');
    const partTimeRates = document.getElementById('partTimeRates');
    const revenueInput = document.getElementById('payRevenueInput');
    
    if (type === 'full-time') {
        fullTimeBtn.classList.add('active');
        partTimeBtn.classList.remove('active');
        weeklySalaryCard.classList.remove('hidden');
        fullTimeRates.classList.remove('hidden');
        partTimeRates.classList.add('hidden');
        revenueInput.querySelector('label').innerHTML = 'Trip Revenue ($) <span class="required">*</span>';
        revenueInput.classList.remove('hidden');
    } else {
        fullTimeBtn.classList.remove('active');
        partTimeBtn.classList.add('active');
        weeklySalaryCard.classList.add('hidden');
        fullTimeRates.classList.add('hidden');
        partTimeRates.classList.remove('hidden');
        
        // Check if flat rate selected
        const selectedVehicle = document.querySelector('input[name="ptVehicle"]:checked').value;
        if (selectedVehicle === 'half-day' || selectedVehicle === 'full-day') {
            reve<br>nueInput.classList.add('hidden');
        } else {
            revenueInput.querySelector('label').innerHTML = 'Trip Revenue ($) <span class="required">*</span>';
            revenueInput.classList.remove('hidden');
        }
    }
}

// Update rate display when selection changes
function updateRateDisplay() {
    const fullTimeBtn = document.getElementById('fullTimeBtn');
    const partTimeBtn = document.getElementById('partTimeBtn');
    const revenueInput = document.getElementById('payRevenueInput');
    
    if (partTimeBtn.classList.contains('active')) {
        // Check if flat rate selected for part-time
        const selectedVehicle = document.querySelector('input[name="ptVehicle"]:checked').value;
        if (selectedVehicle === 'half-day' || selectedVehicle === 'full-day') {
            revenueInput.classList.add('hidden');
        } else {
            revenueInput.classList.remove('hidden');
        }
    }
}

// Calculate pay with new structure
function calculatePayNew() {
    const fullTimeBtn = document.getElementById('fullTimeBtn');
    const isFullTime = fullTimeBtn.classList.contains('active');
    
    const revenue = parseFloat(document.getElementById('pay_revenue').value) || 0;
    const deadheadHours = parseFloat(document.getElementById('pay_deadheadHours').value) || 0;
    const relayHours = parseFloat(document.getElementById('pay_relayHours').value) || 0;
    const isSafety = document.getElementById('pay_safety').checked;
    
    let driverType, tripType, vehicleType;
    
    if (isFullTime) {
        driverType = 'full-time';
        tripType = document.querySelector('input[name="ftTripType"]:checked').value;
        vehicleType = null;
        
        if (revenue <= 0) {
            alert('Please enter trip revenue for full-time drivers.');
            return;
        }
    } else {
        driverType = 'part-time';
        tripType = null;
        vehicleType = document.querySelector('input[name="ptVehicle"]:checked').value;
        
        if ((vehicleType === 'sedan-suv' || vehicleType === 'van-motorcoach') && revenue <= 0) {
            alert('Please enter trip revenue for retail trips.');
            return;
        }
    }
    
    // Calculate pay breakdown
    const payBreakdown = calculateTripPay({
        driverType: driverType,
        tripType: tripType,
        vehicleType: vehicleType,
        tripRevenue: revenue,
        tripDurationHours: 0,
        includesDeadhead: deadheadHours > 0,
        deadheadDurationHours: deadheadHours,
        includesRelay: relayHours > 0,
        relayDurationHours: relayHours,
        isSafetyEligible: isSafety
    });
    
    // Display results
    const resultsDiv = document.getElementById('payResultsNew');
    const displayDiv = document.getElementById('payBreakdownNew');
    resultsDiv.classList.remove('hidden');
    
    let html = '<div class="pay-breakdown-grid">';
    
    // Pay breakdown card
    html += `
        <div class="pay-breakdown-card" style="grid-column: 1 / -1;">
            <div class="pay-breakdown-header">💰 Your Estimated Earnings</div>
            ${revenue > 0 || vehicleType === 'half-day' || vehicleType === 'full-day' ? `
            <div class="pay-breakdown-row">
                <span>${payBreakdown.payLabel}:</span>
                <span class="pay-amount">$${payBreakdown.basePay}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.safetyBonus) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Safety/Compliance Bonus (4%):</span>
                <span class="pay-amount">$${payBreakdown.safetyBonus}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.deadheadPay) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Deadhead Bonus (${deadheadHours.toFixed(1)}h):</span>
                <span class="pay-amount">$${payBreakdown.deadheadPay}</span>
            </div>
            ` : ''}
            ${parseFloat(payBreakdown.relayPay) > 0 ? `
            <div class="pay-breakdown-row">
                <span>Relay Bonus (${relayHours.toFixed(1)}h):</span>
                <span class="pay-amount">$${payBreakdown.relayPay}</span>
            </div>
            ` : ''}
            <div class="pay-breakdown-row total">
                <span><strong>${driverType === 'full-time' ? 'Trip Earnings:' : 'Total Pay:'}</strong></span>
                <span class="pay-amount"><strong>$${payBreakdown.totalPay}</strong></span>
            </div>
            ${driverType === 'full-time' ? `
            <div class="pay-break down-row grand-total">
                <span><strong>With Weekly Salary ($400):</strong></span>
                <span class="pay-amount"><strong>$${(parseFloat(payBreakdown.totalPay) + WEEKLY_SALARY).toFixed(2)}</strong></span>
            </div>
            ` : ''}
        </div>
    `;
    
    html += '</div>';
    displayDiv.innerHTML = html;
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Generate HOS Engine Recommendations
function generateHOSEngineRecommendations(drivingHours, onDutyHours, weeklyUsed, status, miles, avgSpeed) {
    const recommendationsList = document.getElementById('hosRecommendationsEngine');
    let html = '';
    
    if (status === 'LEGAL') {
        html += `
            <div class="recommendation-hos-item success">
                <div class="recommendation-hos-icon">✅</div>
                <div class="recommendation-hos-text">
                    <strong>Trip is Compliant</strong>
                    All DOT HOS regulations are satisfied for this trip.
                </div>
            </div>
        `;
        
        if (drivingHours >= 8) {
            html += `
                <div class="recommendation-hos-item warning">
                    <div class="recommendation-hos-icon">⏰</div>
                    <div class="recommendation-hos-text">
                        <strong>30-Minute Break Required</strong>
                        After ${formatHours(drivingHours)} of driving, you must take a 30-minute break.
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="recommendation-hos-item">
                <div class="recommendation-hos-icon">💡</div>
                <div class="recommendation-hos-text">
                    <strong>Post-Trip Reset</strong>
                    After completing this trip, you'll need a 10-hour off-duty period before your next shift.
                </div>
            </div>
        `;
    } else if (status.includes('EXCEEDS DRIVING')) {
        const excess = drivingHours - 10;
        const excessMiles = excess * avgSpeed;
        
        html += `
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">🚛</div>
                <div class="recommendation-hos-text">
                    <strong>Deadhead Solution</strong>
                    Reposition the bus ${excessMiles.toFixed(0)} miles closer to the pickup location the day before. This reduces passenger trip to 10 hours (LEGAL).
                </div>
            </div>
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">🔄</div>
                <div class="recommendation-hos-text">
                    <strong>Driver Relay Solution</strong>
                    Switch drivers at approximately ${(10 * avgSpeed).toFixed(0)} miles mark. First driver completes 10 hours, second driver completes remaining ${excessMiles.toFixed(0)} miles.
                </div>
            </div>
        `;
    } else if (status.includes('EXCEEDS ON-DUTY')) {
        html += `
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">🏨</div>
                <div class="recommendation-hos-text">
                    <strong>Overnight Hotel Solution</strong>
                    Schedule an overnight stop mid-trip. Split the journey into two days with a 10-hour rest period between.
                </div>
            </div>
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">🔄</div>
                <div class="recommendation-hos-text">
                    <strong>Driver Relay Solution</strong>
                    Hand off to another driver mid-route to complete the trip within a single day.
                </div>
            </div>
        `;
    } else if (status.includes('WEEKLY')) {
        const remaining = getMaxWeeklyHours() - weeklyUsed;
        html += `
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">⏰</div>
                <div class="recommendation-hos-text">
                    <strong>34-Hour Restart Required</strong>
                    You only have ${formatHours(remaining)} remaining in your weekly period. A 34-hour off-duty restart is needed before this trip.
                </div>
            </div>
            <div class="recommendation-hos-item">
                <div class="recommendation-hos-icon">📅</div>
                <div class="recommendation-hos-text">
                    <strong>Schedule Trip After Restart</strong>
                    Plan this trip for after your next 34-hour restart period to ensure compliance.
                </div>
            </div>
        `;
    } else if (status.includes('APPROACHING')) {
        html += `
            <div class="recommendation-hos-item warning">
                <div class="recommendation-hos-icon">⚠️</div>
                <div class="recommendation-hos-text">
                    <strong>Minimal Buffer Remaining</strong>
                    Trip is close to DOT limits. Consider building in extra time for unexpected delays or traffic.
                </div>
            </div>
            <div class="recommendation-hos-item">
                <div class="recommendation-hos-icon">💡</div>
                <div class="recommendation-hos-text">
                    <strong>Plan for Contingencies</strong>
                    Add 30-60 minutes of buffer time for weather, traffic, or passenger delays.
                </div>
            </div>
        `;
    }
    
    recommendationsList.innerHTML = html;
}

// Calculate Driver Pay from HOS Trip
function calculateDriverPayFromHOS() {
    // Get HOS trip data
    const miles = parseFloat(document.getElementById('hosMiles').value);
    const avgSpeed = parseFloat(document.getElementById('hosAvgSpeed').value);
    
    if (!miles || !avgSpeed) {
        alert('Please calculate HOS trip first before calculating pay.');
        return;
    }
    
    // Calculate driving hours
    const drivingHours = miles / avgSpeed;
    
    // Navigate to pay calculator
    showSection('pay-calculator');
    
    // Show prompt for user to enter revenue
    alert(`💰 Driver Pay Calculator\n\nTrip Details:\n• Distance: ${miles.toFixed(0)} miles\n• Driving Time: ${formatHours(drivingHours)}\n\nPlease enter trip revenue and select driver type to calculate pay.`);
    
    // Scroll to pay calculator inputs
    setTimeout(() => {
        const payRevenueInput = document.getElementById('pay_revenue');
        if (payRevenueInput) {
            payRevenueInput.focus();
        }
    }, 500);
}

// Set date selector to today
function setToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dashboardDate').value = today;
    const hosDate = document.getElementById('hosStartDate');
    if (hosDate) {
        hosDate.value = today;
    }
}

// Show/hide sections based on navigation
function showSection(sectionId) {
    // Smooth scroll to section if it exists
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Update dashboard stats
function updateDashboardStats() {
    // Calculate current hours including ongoing status
    let currentDriving = drivingHours;
    let currentDuty = onDutyHours;
    let currentWeekly = weeklyHours;
    let currentBreakTime = timeSinceLastBreak;
    
    if (statusStartTime) {
        const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
        
        if (currentStatus === 'driving') {
            currentDriving += ongoingDuration;
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
            currentBreakTime += ongoingDuration;
        } else if (currentStatus === 'on-duty') {
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
            currentBreakTime += ongoingDuration;
        }
    }
    
    // Update stat cards
    // Calculate fleet management statistics
    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Count trips scheduled for today
    const tripsToday = trips.filter(trip => {
        if (!trip.startDate) return false;
        return trip.startDate === todayStr;
    }).length;
    
    document.getElementById('statTripsToday').textContent = tripsToday;
    
    // Update trips today progress bar (out of 10 as a reasonable daily max)
    const tripsTodayPercent = Math.min(100, (tripsToday / 10) * 100);
    document.getElementById('statTripsTodayProgress').style.width = tripsTodayPercent + '%';
    
    // Drivers on duty (showing 1 for now, can be extended for multi-driver tracking)
    const driversOnDuty = currentStatus !== 'off-duty' ? 1 : 0;
    document.getElementById('statDriversOnDuty').textContent = driversOnDuty;
    
    // Compliance rate calculation
    let legalCount = 0;
    let warningCount = 0;
    let illegalCount = 0;
    
    trips.forEach(trip => {
        if (trip.status === 'LEGAL') {
            legalCount++;
        } else if (trip.status === 'TRIP_NOT_POSSIBLE_UNDER_DOT') {
            illegalCount++;
        } else {
            warningCount++;
        }
    });
    
    const totalTrips = trips.length;
    const complianceRate = totalTrips > 0 ? ((legalCount / totalTrips) * 100).toFixed(0) : 100;
    document.getElementById('statComplianceRate').textContent = complianceRate + '%';
    
    if (complianceRate >= 90) {
        document.getElementById('statComplianceDetails').textContent = 'Excellent compliance';
        document.getElementById('statComplianceDetails').style.color = '#10B981';
    } else if (complianceRate >= 70) {
        document.getElementById('statComplianceDetails').textContent = 'Needs improvement';
        document.getElementById('statComplianceDetails').style.color = '#F59E0B';
    } else {
        document.getElementById('statComplianceDetails').textContent = 'Action required';
        document.getElementById('statComplianceDetails').style.color = '#EF4444';
    }
    
    // Vehicles active (showing 1 for now)
    document.getElementById('statVehiclesActive').textContent = '1';

    
    // Update trip legality counts
    updateLegalityCounts();
    
    // Update driver status overview
    updateDriverStatusOverview(currentBreakTime);
    
    // Update trips table
    updateTripsTable();
}

// Update legality counts
function updateLegalityCounts() {
    let legalCount = 0;
    let warningCount = 0;
    let illegalCount = 0;
    
    trips.forEach(trip => {
        if (trip.status === 'LEGAL') {
            legalCount++;
        } else if (trip.status === 'TRIP_NOT_POSSIBLE_UNDER_DOT') {
            illegalCount++;
        } else {
            warningCount++;
        }
    });
    
    document.getElementById('legalCount').textContent = legalCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('illegalCount').textContent = illegalCount;
    document.getElementById('totalTripsCount').textContent = trips.length;
    
    // Update segmented bar
    const total = trips.length;
    if (total > 0) {
        const legalPercent = (legalCount / total) * 100;
        const warningPercent = (warningCount / total) * 100;
        const illegalPercent = (illegalCount / total) * 100;
        
        document.getElementById('legalSegment').style.width = legalPercent + '%';
        document.getElementById('warningSegment').style.width = warningPercent + '%';
        document.getElementById('illegalSegment').style.width = illegalPercent + '%';
        
        // Update labels
        if (legalPercent > 15) {
            document.getElementById('legalSegmentLabel').textContent = `${legalCount} Legal`;
        } else {
            document.getElementById('legalSegmentLabel').textContent = legalCount > 0 ? legalCount : '';
        }
        
        if (warningPercent > 15) {
            document.getElementById('warningSegmentLabel').textContent = `${warningCount} Warning`;
        } else {
            document.getElementById('warningSegmentLabel').textContent = warningCount > 0 ? warningCount : '';
        }
        
        if (illegalPercent > 15) {
            document.getElementById('illegalSegmentLabel').textContent = `${illegalCount} Illegal`;
        } else {
            document.getElementById('illegalSegmentLabel').textContent = illegalCount > 0 ? illegalCount : '';
        }
    } else {
        // No trips - reset bar
        document.getElementById('legalSegment').style.width = '0%';
        document.getElementById('warningSegment').style.width = '0%';
        document.getElementById('illegalSegment').style.width = '0%';
        document.getElementById('legalSegmentLabel').textContent = '';
        document.getElementById('warningSegmentLabel').textContent = '';
        document.getElementById('illegalSegmentLabel').textContent = '';
    }
}

// Update driver status overview
function updateDriverStatusOverview(currentBreakTime) {
    document.getElementById('overviewHOSMode').textContent = hosMode === '70_8' ? '70HR/8Day' : '70HR/7Day';
    // Update Driver 10 HRS card - always show the 10:00 limit
    document.getElementById('overviewDriverHours').textContent = '10:00';
    
    const driverStatus = document.getElementById('overviewDriverStatus');
    if (drivingHours >= 10) {
        driverStatus.textContent = '❌ Limit Reached';
        driverStatus.style.color = '#EF4444';
    } else if (drivingHours >= 8) {
        driverStatus.textContent = '⚠️ Near Limit';
        driverStatus.style.color = '#F59E0B';
    } else {
        driverStatus.textContent = '✅ Available';
        driverStatus.style.color = '#10B981';
    }

    // Update Shift 15 HRS card - always show the 15:00 limit
    document.getElementById('overviewShiftHours').textContent = '15:00';
    
    const shiftStatus = document.getElementById('overviewShiftStatus');
    if (onDutyHours >= 15) {
        shiftStatus.textContent = '❌ Limit Reached';
        shiftStatus.style.color = '#EF4444';
    } else if (onDutyHours >= 12) {
        shiftStatus.textContent = '⚠️ Near Limit';
        shiftStatus.style.color = '#F59E0B';
    } else {
        shiftStatus.textContent = '✅ Available';
        shiftStatus.style.color = '#10B981';
    }

    // Update Cycle 70 HRS card - show the limit based on HOS mode
    const maxWeekly = getMaxWeeklyHours();
    document.getElementById('overviewCycleHours').textContent = `${maxWeekly}:00`;
    
    const cycleStatus = document.getElementById('overviewCycleStatus');
    if (weeklyHours >= maxWeekly) {
        cycleStatus.textContent = '❌ Limit Reached';
        cycleStatus.style.color = '#EF4444';
    } else if (weeklyHours >= (maxWeekly * 0.85)) {
        cycleStatus.textContent = '⚠️ Near Limit';
        cycleStatus.style.color = '#F59E0B';
    } else {
        cycleStatus.textContent = '✅ Available';
        cycleStatus.style.color = '#10B981';
    }
    
    // Calculate next reset
    if (currentStatus === 'off-duty' && statusStartTime) {
        const currentOffDutyHours = (Date.now() - statusStartTime) / (1000 * 60 * 60);
        const hoursToRestart = Math.max(0, 34 - currentOffDutyHours);
        document.getElementById('overviewNextReset').textContent = `${hoursToRestart.toFixed(1)}H`;
    } else {
        document.getElementById('overviewNextReset').textContent = '34HR Needed';
    }
    
    // Today's summary
    document.getElementById('overviewTodaySummary').textContent = `${trips.length} Trips`;
}

// Update trips table
function updateTripsTable() {
    const tbody = document.getElementById('tripsTableBody');
    
    if (trips.length === 0) {
        tbody.innerHTML = `
            <tr class="no-trips-row">
                <td colspan="7" style="text-align: center; padding: 40px; color: #6B7280;">
                    No upcoming trips scheduled. Add trips to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    trips.forEach((trip, index) => {
        const drivingTime = trip.miles / trip.avgSpeedMph;
        const deadheadTime = trip.deadheadMiles ? trip.deadheadMiles / (trip.deadheadSpeedMph || trip.avgSpeedMph) : 0;
        const totalDriving = drivingTime + deadheadTime;
        const totalOnDuty = totalDriving + ((trip.preTripMinutes || 0) + 15 + (trip.postTripMinutes || 0)) / 60;
        
        const statusBadge = trip.status ? `<span class="status-badge ${trip.status.toLowerCase()}">${trip.status.replace(/_/g, ' ')}</span>` : '';
        const payDisplay = trip.payBreakdown ? `$${trip.payBreakdown.totalPay}` : '-';
        
        html += `
            <tr>
                <td><strong>Trip ${index + 1}</strong></td>
                <td>${trip.startDate || 'Not Set'}</td>
                <td>${trip.miles.toFixed(0)} mi</td>
                <td>${formatHours(totalOnDuty)}</td>
                <td>${statusBadge}</td>
                <td><strong>${payDisplay}</strong></td>
                <td>
                    <button class="table-action-btn" onclick="editTrip(${trip.id})">Edit</button>
                    <button class="table-action-btn danger" onclick="removeTrip(${trip.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Show create trip form
function showCreateTripForm() {
    const form = document.getElementById('createTripForm');
    form.classList.remove('hidden');
    document.getElementById('formTitle').textContent = '➕ Create New Trip';
    form.scrollIntoView({ behavior: 'smooth' });
}

// Cancel trip form
function cancelTripForm() {
    const form = document.getElementById('createTripForm');
    form.classList.add('hidden');
    
    // Clear all form fields
    document.getElementById('trip_passengerName').value = '';
    document.getElementById('trip_passengerCount').value = '';
    document.getElementById('trip_contactPhone').value = '';
    document.getElementById('trip_pickupLocation').value = '';
    document.getElementById('trip_pickupTimeNew').value = '';
    document.getElementById('trip_dropoffLocation').value = '';
    document.getElementById('trip_dropoffTimeNew').value = '';
    document.getElementById('trip_milesNew').value = '';
    document.getElementById('trip_avgSpeedNew').value = '60';
    document.getElementById('trip_stopMinutes').value = '';
    document.getElementById('trip_stopLocation').value = '';
    document.getElementById('trip_dumpFuelMinutes').value = '';
    document.getElementById('trip_serviceLocation').value = '';
    document.getElementById('trip_deadheadMiles').value = '';
    document.getElementById('trip_deadheadSpeed').value = '60';
    document.getElementById('trip_relayRequired').checked = false;
    document.getElementById('trip_relayLocation').value = '';
}

// Save trip from form
function saveTripFromForm() {
    // Collect form data
    const passengerName = document.getElementById('trip_passengerName').value.trim();
    const passengerCount = parseInt(document.getElementById('trip_passengerCount').value) || 0;
    const contactPhone = document.getElementById('trip_contactPhone').value.trim();
    const pickupLocation = document.getElementById('trip_pickupLocation').value.trim();
    const pickupTime = document.getElementById('trip_pickupTimeNew').value;
    const dropoffLocation = document.getElementById('trip_dropoffLocation').value.trim();
    const dropoffTime = document.getElementById('trip_dropoffTimeNew').value;
    const miles = parseFloat(document.getElementById('trip_milesNew').value);
    const avgSpeed = parseFloat(document.getElementById('trip_avgSpeedNew').value);
    const stopMinutes = parseInt(document.getElementById('trip_stopMinutes').value) || 0;
    const stopLocation = document.getElementById('trip_stopLocation').value.trim();
    const dumpFuelMinutes = parseInt(document.getElementById('trip_dumpFuelMinutes').value) || 0;
    const serviceLocation = document.getElementById('trip_serviceLocation').value.trim();
    
    // Front-end and back-end deadheads
    const frontDeadheadMiles = parseFloat(document.getElementById('trip_frontDeadheadMiles').value) || 0;
    const frontDeadheadSpeed = parseFloat(document.getElementById('trip_frontDeadheadSpeed').value) || 60;
    const backDeadheadMiles = parseFloat(document.getElementById('trip_backDeadheadMiles').value) || 0;
    const backDeadheadSpeed = parseFloat(document.getElementById('trip_backDeadheadSpeed').value) || 60;
    
    // Front-end and back-end relays
    const frontRelayRequired = document.getElementById('trip_frontRelayRequired').checked;
    const frontRelayLocation = document.getElementById('trip_frontRelayLocation').value.trim();
    const backRelayRequired = document.getElementById('trip_backRelayRequired').checked;
    const backRelayLocation = document.getElementById('trip_backRelayLocation').value.trim();
    
    // Validate required fields
    if (!passengerName) {
        alert('Please enter passenger/group name');
        return;
    }
    if (!pickupLocation || !pickupTime) {
        alert('Please enter pickup location and time');
        return;
    }
    if (!dropoffLocation || !dropoffTime) {
        alert('Please enter dropoff location and time');
        return;
    }
    if (!miles || miles <= 0 || !avgSpeed || avgSpeed <= 0) {
        alert('Please enter valid distance and average speed');
        return;
    }
    
    // Calculate HOS with separate front and back deadheads
    const preTrip = 15;
    const postTrip = 15;
    const drivingHours = miles / avgSpeed;
    const frontDeadheadHours = frontDeadheadMiles > 0 ? frontDeadheadMiles / frontDeadheadSpeed : 0;
    const backDeadheadHours = backDeadheadMiles > 0 ? backDeadheadMiles / backDeadheadSpeed : 0;
    const totalDeadheadHours = frontDeadheadHours + backDeadheadHours;
    
    const onDutyHours = (preTrip + stopMinutes + dumpFuelMinutes + postTrip) / 60 + drivingHours + totalDeadheadHours;
    
    // Determine status
    let status = 'LEGAL';
    if ((drivingHours + totalDeadheadHours) > 10) {
        status = 'EXCEEDS_DRIVING_LIMIT';
    } else if (onDutyHours > 15) {
        status = 'EXCEEDS_ON_DUTY_LIMIT';
    } else if (frontRelayRequired || backRelayRequired) {
        status = 'RELAY_REQUIRED';
    }
    
    // Create trip object with separate front/back deadheads and relays
    const trip = {
        id: Date.now(),
        passengerName: passengerName,
        passengerCount: passengerCount,
        contactPhone: contactPhone,
        pickupLocation: pickupLocation,
        pickupTime: pickupTime,
        dropoffLocation: dropoffLocation,
        dropoffTime: dropoffTime,
        miles: miles,
        avgSpeedMph: avgSpeed,
        stopMinutes: stopMinutes,
        stopLocation: stopLocation,
        dumpFuelMinutes: dumpFuelMinutes,
        serviceLocation: serviceLocation,
        
        // Front-end deadhead
        frontDeadheadMiles: frontDeadheadMiles,
        frontDeadheadSpeed: frontDeadheadSpeed,
        
        // Back-end deadhead
        backDeadheadMiles: backDeadheadMiles,
        backDeadheadSpeed: backDeadheadSpeed,
        
        // Front-end relay
        frontRelayRequired: frontRelayRequired,
        frontRelayLocation: frontRelayLocation,
        
        // Back-end relay
        backRelayRequired: backRelayRequired,
        backRelayLocation: backRelayLocation,
        
        preTripMinutes: preTrip,
        postTripMinutes: postTrip,
        status: status,
        startDate: new Date().toISOString().split('T')[0],
        addedAt: Date.now()
    };
    
    // Add to trips array
    trips.push(trip);
    
    // Update display
    updateTripsManagementTable();
    updateDashboardStats();
    saveData();
    
    // Hide form and clear
    cancelTripForm();
    
    alert('✅ Trip created successfully!');
}

// Update trips management table
function updateTripsManagementTable() {
    const tbody = document.getElementById('tripsManagementTableBody');
    
    if (trips.length === 0) {
        tbody.innerHTML = `
            <tr class="no-trips-row">
                <td colspan="9" style="text-align: center; padding: 40px; color: #6B7280;">
                    No trips in system. Click "Create New Trip" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    trips.forEach((trip, index) => {
        const drivingTime = trip.miles / trip.avgSpeedMph;
        const deadheadTime = trip.deadheadMiles ? trip.deadheadMiles / trip.deadheadSpeedMph : 0;
        const totalOnDuty = drivingTime + deadheadTime + ((trip.preTripMinutes || 0) + (trip.stopMinutes || 0) + (trip.dumpFuelMinutes || 0) + (trip.postTripMinutes || 0)) / 60;
        
        const pickupDropoff = `${trip.pickupLocation || 'N/A'} → ${trip.dropoffLocation || 'N/A'}`;
        const statusBadge = trip.status ? `<span class="status-badge ${trip.status.toLowerCase()}">${trip.status.replace(/_/g, ' ')}</span>` : '';
        const payDisplay = trip.payBreakdown ? `$${trip.payBreakdown.totalPay}` : '-';
        
        html += `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${trip.startDate || 'Not Set'}</td>
                <td>${trip.passengerName || 'N/A'}</td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${pickupDropoff}">${pickupDropoff}</td>
                <td>${trip.miles.toFixed(0)} mi</td>
                <td>${formatHours(totalOnDuty)}</td>
                <td>${statusBadge}</td>
                <td><strong>${payDisplay}</strong></td>
                <td>
                    <button class="table-action-btn" onclick="viewTripDetails(${trip.id})" title="View trip details">👁️ View</button>
                    <button class="table-action-btn" onclick="editTrip(${trip.id})" title="Edit trip">✏️ Edit</button>
                    <button class="table-action-btn" onclick="runHOSCheckForTrip(${trip.id})" title="Run HOS check">🧮 HOS</button>
                    <button class="table-action-btn danger" onclick="removeTrip(${trip.id})" title="Delete trip">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// View trip details
function viewTripDetails(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const drivingTime = trip.miles / trip.avgSpeedMph;
    const deadheadTime = trip.deadheadMiles ? trip.deadheadMiles / trip.deadheadSpeedMph : 0;
    const totalOnDuty = drivingTime + deadheadTime + ((trip.preTripMinutes || 0) + (trip.stopMinutes || 0) + (trip.dumpFuelMinutes || 0) + (trip.postTripMinutes || 0)) / 60;
    
    let details = `
🚌 TRIP DETAILS

👥 Passenger/Group: ${trip.passengerName || 'N/A'}
${trip.passengerCount > 0 ? `   Passenger Count: ${trip.passengerCount}\n` : ''}${trip.contactPhone ? `   Contact: ${trip.contactPhone}\n` : ''}
📍 Pickup: ${trip.pickupLocation || 'N/A'} at ${trip.pickupTime || 'N/A'}
📍 Dropoff: ${trip.dropoffLocation || 'N/A'} at ${trip.dropoffTime || 'N/A'}

🚗 Trip Details:
   Distance: ${trip.miles.toFixed(1)} miles @ ${trip.avgSpeedMph} mph
   Driving Time: ${formatHours(drivingTime)}
${trip.stopMinutes > 0 ? `   Passenger Stops: ${trip.stopMinutes} min${trip.stopLocation ? ` at ${trip.stopLocation}` : ''}\n` : ''}${trip.dumpFuelMinutes > 0 ? `   Dump/Fuel/Clean: ${trip.dumpFuelMinutes} min${trip.serviceLocation ? ` at ${trip.serviceLocation}` : ''}\n` : ''}${trip.deadheadMiles > 0 ? `   Deadhead: ${trip.deadheadMiles.toFixed(1)} miles (${formatHours(deadheadTime)})\n` : ''}${trip.relayRequired ? `   Relay: YES${trip.relayLocation ? ` at ${trip.relayLocation}` : ''}\n` : ''}
⏱️ HOS Summary:
   Total On-Duty Time: ${formatHours(totalOnDuty)}
   Status: ${trip.status || 'UNKNOWN'}

💰 Pay: ${trip.payBreakdown ? `$${trip.payBreakdown.totalPay}` : 'Not calculated'}
    `;
    
    alert(details);
}

// Run HOS check for specific trip
function runHOSCheckForTrip(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    // Populate HOS calculator with trip data
    document.getElementById('hosStartDate').value = trip.startDate || new Date().toISOString().split('T')[0];
    document.getElementById('hosStartTime').value = trip.pickupTime || '08:00';
    document.getElementById('hosMiles').value = trip.miles;
    document.getElementById('hosAvgSpeed').value = trip.avgSpeedMph;
    document.getElementById('hosPreTrip').value = trip.preTripMinutes || 15;
    document.getElementById('hosPostTrip').value = trip.postTripMinutes || 15;
    document.getElementById('hosStops').value = trip.stopMinutes || 0;
    document.getElementById('hosDumpFuel').value = trip.dumpFuelMinutes || 0;
    
    // Navigate to HOS calculator
    showSection('trip-calc');
    
    // Auto-calculate
    calculateHOSTrip();
}

// Vehicles Management Functions
let vehicles = [
    {
        id: 1,
        vehicleId: 'Bus #001',
        type: 'Motorcoach',
        makeModel: 'Prevost H3-45',
        year: 2022,
        licensePlate: 'ABC-1234',
        capacity: 55,
        wheelchairAccessible: true,
        luggageBays: 8,
        lastInspection: '2024-03-01',
        mileage: 125000,
        status: 'available',
        assignedDriver: null
    }
];

// Show create vehicle form
function showCreateVehicleForm() {
    const form = document.getElementById('createVehicleForm');
    form.classList.remove('hidden');
    document.getElementById('vehicleFormTitle').textContent = '➕ Add New Vehicle';
    form.scrollIntoView({ behavior: 'smooth' });
}

// Cancel vehicle form
function cancelVehicleForm() {
    const form = document.getElementById('createVehicleForm');
    form.classList.add('hidden');
    
    // Clear all form fields
    document.getElementById('vehicle_id').value = '';
    document.getElementById('vehicle_type').value = 'motorcoach';
    document.getElementById('vehicle_make').value = '';
    document.getElementById('vehicle_year').value = '';
    document.getElementById('vehicle_plate').value = '';
    document.getElementById('vehicle_capacity').value = '';
    document.getElementById('vehicle_wheelchair').checked = false;
    document.getElementById('vehicle_luggage').value = '';
    document.getElementById('vehicle_lastInspection').value = '';
    document.getElementById('vehicle_mileage').value = '';
}

// Save vehicle
function saveVehicle() {
    const vehicleId = document.getElementById('vehicle_id').value.trim();
    const type = document.getElementById('vehicle_type').value;
    const makeModel = document.getElementById('vehicle_make').value.trim();
    const year = parseInt(document.getElementById('vehicle_year').value);
    const plate = document.getElementById('vehicle_plate').value.trim();
    const capacity = parseInt(document.getElementById('vehicle_capacity').value);
    const wheelchair = document.getElementById('vehicle_wheelchair').checked;
    const luggage = parseInt(document.getElementById('vehicle_luggage').value) || 0;
    const lastInspection = document.getElementById('vehicle_lastInspection').value;
    const mileage = parseInt(document.getElementById('vehicle_mileage').value) || 0;
    
    // Validate required fields
    if (!vehicleId) {
        alert('Please enter a Vehicle ID');
        return;
    }
    if (!capacity || capacity <= 0) {
        alert('Please enter a valid passenger capacity');
        return;
    }
    
    // Create vehicle object
    const vehicle = {
        id: Date.now(),
        vehicleId: vehicleId,
        type: type.charAt(0).toUpperCase() + type.slice(1),
        makeModel: makeModel || 'Not specified',
        year: year || null,
        licensePlate: plate || 'Not specified',
        capacity: capacity,
        wheelchairAccessible: wheelchair,
        luggageBays: luggage,
        lastInspection: lastInspection || null,
        mileage: mileage,
        status: 'available',
        assignedDriver: null,
        addedAt: Date.now()
    };
    
    // Add to vehicles array
    vehicles.push(vehicle);
    
    // Update display
    renderVehiclesGrid();
    saveData();
    
    // Hide form and clear
    cancelVehicleForm();
    
    alert('✅ Vehicle added successfully!');
}

// View vehicle profile
function viewVehicleProfile(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // Populate profile
    document.getElementById('profile_vehicleId').textContent = vehicle.vehicleId;
    document.getElementById('profile_type').textContent = vehicle.type;
    document.getElementById('profile_makeModel').textContent = vehicle.makeModel;
    document.getElementById('profile_year').textContent = vehicle.year || 'Not specified';
    document.getElementById('profile_plate').textContent = vehicle.licensePlate;
    document.getElementById('profile_capacity').textContent = `${vehicle.capacity} passengers`;
    document.getElementById('profile_wheelchair').textContent = vehicle.wheelchairAccessible ? '✅ Yes' : '❌ No';
    document.getElementById('profile_luggage').textContent = vehicle.luggageBays > 0 ? `${vehicle.luggageBays} bays` : 'None';
    document.getElementById('profile_lastInspection').textContent = vehicle.lastInspection || 'Not recorded';
    
    // Calculate next inspection (90 days)
    if (vehicle.lastInspection) {
        const lastDate = new Date(vehicle.lastInspection);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 90);
        document.getElementById('profile_nextInspection').textContent = nextDate.toLocaleDateString();
    } else {
        document.getElementById('profile_nextInspection').textContent = 'Not scheduled';
    }
    
    document.getElementById('profile_mileage').textContent = vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} miles` : 'Not recorded';
    
    // Maintenance status
    let maintenanceStatus = '✅ Good';
    let statusColor = '#10B981';
    if (vehicle.lastInspection) {
        const daysSince = Math.floor((Date.now() - new Date(vehicle.lastInspection)) / 86400000);
        if (daysSince > 90) {
            maintenanceStatus = '⚠️ Inspection Overdue';
            statusColor = '#EF4444';
        } else if (daysSince > 75) {
            maintenanceStatus = '⏰ Inspection Due Soon';
            statusColor = '#F59E0B';
        }
    }
    const statusElement = document.getElementById('profile_maintenanceStatus');
    statusElement.textContent = maintenanceStatus;
    statusElement.style.color = statusColor;
    
    // Assigned trips
    const assignedTripsDiv = document.getElementById('profile_assignedTrips');
    const vehicleTrips = trips.filter(t => t.vehicleId === vehicleId);
    
    if (vehicleTrips.length === 0) {
        assignedTripsDiv.innerHTML = `
            <div class="profile-detail-row">
                <span style="color: #6B7280;">No trips currently assigned</span>
            </div>
        `;
    } else {
        let tripsHTML = '';
        vehicleTrips.forEach((trip, idx) => {
            tripsHTML += `
                <div class="profile-detail-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                    <span><strong>Trip ${idx + 1}</strong> - ${trip.startDate || 'No date'}</span>
                    <span style="font-size: 0.85em; color: #6B7280;">${trip.miles.toFixed(0)} mi • ${trip.passengerName || 'No name'}</span>
                </div>
            `;
        });
        assignedTripsDiv.innerHTML = tripsHTML;
    }
    
    // Show profile
    document.getElementById('vehicleProfileTitle').textContent = `🚐 ${vehicle.vehicleId} Profile`;
    document.getElementById('vehicleProfile').classList.remove('hidden');
    document.getElementById('vehicleProfile').scrollIntoView({ behavior: 'smooth' });
}

// Close vehicle profile
function closeVehicleProfile() {
    document.getElementById('vehicleProfile').classList.add('hidden');
}

// Edit vehicle
function editVehicle(vehicleId) {
    alert('Edit vehicle functionality coming soon!');
}

// Assign driver to vehicle
function assignDriver(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const driverName = prompt(`Assign driver to ${vehicle.vehicleId}:\n\nEnter driver name:`);
    if (driverName && driverName.trim()) {
        vehicle.assignedDriver = driverName.trim();
        renderVehiclesGrid();
        saveData();
        alert(`✅ ${driverName} assigned to ${vehicle.vehicleId}`);
    }
}

// Render vehicles grid
function renderVehiclesGrid() {
    const grid = document.getElementById('vehiclesGrid');
    
    let html = '';
    vehicles.forEach(vehicle => {
        const icon = vehicle.type === 'Motorcoach' ? '🚌' : 
                     vehicle.type === 'Minibus' ? '🚐' : 
                     vehicle.type === 'Van' ? '🚐' : 
                     vehicle.type === 'Sedan' ? '🚗' : '🚙';
        
        const statusDotClass = vehicle.status === 'available' ? 'active' : 
                               vehicle.status === 'in-use' ? 'in-use' : 'maintenance';
        
        const statusText = vehicle.status === 'available' ? '✅ Available' : 
                          vehicle.status === 'in-use' ? '⏰ In Use' : '🔧 Maintenance';
        
        const statusColor = vehicle.status === 'available' ? '#10B981' : 
                           vehicle.status === 'in-use' ? '#F59E0B' : '#EF4444';
        
        html += `
            <div class="vehicle-card" onclick="viewVehicleProfile(${vehicle.id})">
                <div class="vehicle-header">
                    <div class="vehicle-icon">${icon}</div>
                    <div class="vehicle-status-dot ${statusDotClass}" title="${vehicle.status}"></div>
                </div>
                <div class="vehicle-info">
                    <h4>${vehicle.vehicleId}</h4>
                    <div class="vehicle-detail">Type: <strong>${vehicle.type}</strong></div>
                    <div class="vehicle-detail">Capacity: <strong>${vehicle.capacity} passengers</strong></div>
                    <div class="vehicle-detail">Status: <strong style="color: ${statusColor};">${statusText}</strong></div>
                    ${vehicle.assignedDriver ? `<div class="vehicle-detail">Driver: <strong>${vehicle.assignedDriver}</strong></div>` : ''}
                </div>
                <div class="vehicle-actions">
                    <button class="vehicle-action-btn" onclick="event.stopPropagation(); viewVehicleProfile(${vehicle.id})" title="View">👁️ View</button>
                    <button class="vehicle-action-btn" onclick="event.stopPropagation(); editVehicle(${vehicle.id})" title="Edit">✏️ Edit</button>
                    <button class="vehicle-action-btn" onclick="event.stopPropagation(); assignDriver(${vehicle.id})" title="Assign Driver">👤 Assign</button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Settings Management Functions
let companySettings = {
    companyName: 'ABC Charter & Tours',
    dotNumber: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'EST'
};

let maintenanceSettings = {
    inspectionDays: 90,
    oilChangeMiles: 5000,
    tireRotationMiles: 10000,
    alertDaysBefore: 15
};

let dotSettings = {
    preTripDefault: 15,
    postTripDefault: 15,
    spotBufferDefault: 15,
    garageBufferDefault: 60,
    autoViolationAlerts: true,
    strictCompliance: true
};

// Show settings tab
function showSettingsTab(tabId) {
    // Hide all tabs
    document.getElementById('companyInfo').classList.add('hidden');
    document.getElementById('driversSettings').classList.add('hidden');
    document.getElementById('vehiclesSettings').classList.add('hidden');
    document.getElementById('payStructures').classList.add('hidden');
    document.getElementById('safetyRules').classList.add('hidden');
    document.getElementById('dotCompliance').classList.add('hidden');
    
    // Remove active from all buttons
    const buttons = document.querySelectorAll('.setting-tab');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabId).classList.remove('hidden');
    
    // Mark button as active
    event.target.closest('.setting-tab').classList.add('active');
}

// Save company info
function saveCompanyInfo() {
    companySettings.companyName = document.getElementById('set_companyName').value;
    companySettings.dotNumber = document.getElementById('set_dotNumber').value;
    companySettings.address = document.getElementById('set_address').value;
    companySettings.phone = document.getElementById('set_phone').value;
    companySettings.email = document.getElementById('set_email').value;
    companySettings.timezone = document.getElementById('set_timezone').value;
    
    saveData();
    alert('✅ Company information saved successfully!');
}

// Save vehicle settings
function saveVehicleSettings() {
    maintenanceSettings.inspectionDays = parseInt(document.getElementById('set_inspectionDays').value);
    maintenanceSettings.oilChangeMiles = parseInt(document.getElementById('set_oilChangeMiles').value);
    maintenanceSettings.tireRotationMiles = parseInt(document.getElementById('set_tireRotationMiles').value);
    maintenanceSettings.alertDaysBefore = parseInt(document.getElementById('set_alertDaysBefore').value);
    
    saveData();
    alert('✅ Vehicle settings saved successfully!');
}

// Save pay structures
function savePayStructures() {
    alert('✅ Pay structure settings saved successfully!');
    saveData();
}

// Save safety rules
function saveSafetyRules() {
    alert('✅ Safety rules saved successfully!');
    saveData();
}

// Save DOT compliance settings
function saveDOTCompliance() {
    dotSettings.preTripDefault = parseInt(document.getElementById('set_preTripDefault').value);
    dotSettings.postTripDefault = parseInt(document.getElementById('set_postTripDefault').value);
    dotSettings.spotBufferDefault = parseInt(document.getElementById('set_spotBufferDefault').value);
    dotSettings.garageBufferDefault = parseInt(document.getElementById('set_garageBufferDefault').value);
    dotSettings.autoViolationAlerts = document.getElementById('set_autoViolationAlerts').checked;
    dotSettings.strictCompliance = document.getElementById('set_strictCompliance').checked;
    
    saveData();
    alert('✅ DOT compliance settings saved successfully!');
}

// Show add driver form
function showAddDriverForm() {
    alert('Add driver form coming soon!');
}

// Edit driver
function editDriver(driverId) {
    alert('Edit driver functionality coming soon!');
}

// Remove driver
function removeDriver(driverId) {
    if (confirm('Are you sure you want to remove this driver?')) {
        alert('Driver removed (demo)');
    }
}

// Load saved data on page load
window.addEventListener('load', () => {
    loadData();
    updateDisplay();
    updateDashboardStats();
    renderLog();
    renderTrips();
    updateTripsManagementTable();
    renderVehiclesGrid();
    initializeMap();
    updateHOSModeDisplay();
    setToday();
    
    // Add event listeners for pickup time change
    const pickupInput = document.getElementById('trip_pickupTime');
    if (pickupInput) {
        pickupInput.addEventListener('change', updateGarageTimeDisplay);
        pickupInput.addEventListener('input', updateGarageTimeDisplay);
    }
});

// Initialize Leaflet map
function initializeMap() {
    // Center map on USA
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Handle map clicks
    map.on('click', function(e) {
        handleMapClick(e.latlng);
    });
}

// Handle map clicks for start/destination
function handleMapClick(latlng) {
    if (clickCount === 0) {
        // First click - set start point
        if (startMarker) {
            map.removeLayer(startMarker);
        }
        
        const greenIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        startMarker = L.marker(latlng, { icon: greenIcon })
            .addTo(map)
            .bindPopup('<b>START</b>').openPopup();
        
        clickCount = 1;
    } else if (clickCount === 1) {
        // Second click - set destination
        if (endMarker) {
            map.removeLayer(endMarker);
        }
        
        const redIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        endMarker = L.marker(latlng, { icon: redIcon })
            .addTo(map)
            .bindPopup('<b>DESTINATION</b>').openPopup();
        
        // Draw line between points
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        
        routeLine = L.polyline([startMarker.getLatLng(), endMarker.getLatLng()], {
            color: '#667eea',
            weight: 3,
            opacity: 0.7
        }).addTo(map);
        
        // Calculate distance
        const distance = calculateDistance(
            startMarker.getLatLng(),
            endMarker.getLatLng()
        );
        
        // Update mileage input
        document.getElementById('mileageInput').value = distance.toFixed(1);
        
        clickCount = 0; // Reset for next trip
    }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(latlng1, latlng2) {
    const R = 3958.8; // Earth's radius in miles
    const lat1 = latlng1.lat * Math.PI / 180;
    const lat2 = latlng2.lat * Math.PI / 180;
    const deltaLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const deltaLng = (latlng2.lng - latlng1.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in miles
}

// Get current location and use as start point
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                
                // Clear existing markers
                if (startMarker) {
                    map.removeLayer(startMarker);
                }
                if (endMarker) {
                    map.removeLayer(endMarker);
                }
                if (routeLine) {
                    map.removeLayer(routeLine);
                }
                
                // Set as start point
                const greenIcon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                
                startMarker = L.marker(latlng, { icon: greenIcon })
                    .addTo(map)
                    .bindPopup('<b>START (Current Location)</b>').openPopup();
                
                map.setView(latlng, 10);
                clickCount = 1;
            },
            function(error) {
                alert('Unable to get your location. Please ensure location services are enabled.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Add additional destination input
function addDestination() {
    destinationCount++;
    const container = document.getElementById('additionalDestinations');
    
    const destDiv = document.createElement('div');
    destDiv.className = 'trip-input-grid';
    destDiv.style.marginTop = '10px';
    destDiv.innerHTML = `
        <div class="input-group">
            <label for="destination${destinationCount}">Additional Stop ${destinationCount}</label>
            <input type="text" id="destination${destinationCount}" placeholder="Enter Additional Destination">
        </div>
        <div class="input-group" style="display: flex; align-items: center;">
            <button class="secondary-btn" onclick="removeDestination(${destinationCount})" style="background: #dc3545; color: white; margin-top: 28px;">
                🗑️ Remove
            </button>
        </div>
    `;
    
    container.appendChild(destDiv);
    additionalDestinations.push(destinationCount);
}

// Remove destination input
function removeDestination(destId) {
    const container = document.getElementById('additionalDestinations');
    const elements = container.children;
    
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerHTML.includes(`destination${destId}`)) {
            container.removeChild(elements[i]);
            break;
        }
    }
    
    additionalDestinations = additionalDestinations.filter(id => id !== destId);
}

// Get directions in Google Maps
function getDirections() {
    const fromLocation = document.getElementById('fromLocation').value.trim();
    const toLocation = document.getElementById('toLocation').value.trim();
    
    if (!fromLocation) {
        alert('Please enter a starting location (From)');
        return;
    }
    
    if (!toLocation) {
        alert('Please enter a destination (To)');
        return;
    }
    
    // Build Google Maps URL
    let mapsUrl = 'https://www.google.com/maps/dir/?api=1';
    mapsUrl += '&origin=' + encodeURIComponent(fromLocation);
    mapsUrl += '&destination=' + encodeURIComponent(toLocation);
    
    // Add waypoints (additional destinations)
    const waypoints = [];
    additionalDestinations.forEach(destId => {
        const destInput = document.getElementById(`destination${destId}`);
        if (destInput && destInput.value.trim()) {
            waypoints.push(destInput.value.trim());
        }
    });
    
    if (waypoints.length > 0) {
        mapsUrl += '&waypoints=' + waypoints.map(w => encodeURIComponent(w)).join('|');
    }
    
    // Open in new tab
    window.open(mapsUrl, '_blank');
}

// Clear all points from map
function clearMapPoints() {
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
    }
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    clickCount = 0;
    document.getElementById('mileageInput').value = '';
}

// Toggle HOS Mode
function toggleHOSMode() {
    hosMode = hosMode === '70_8' ? '70_7' : '70_8';
    updateHOSModeDisplay();
    updateDisplay();
    saveData();
}

// Update HOS Mode display
function updateHOSModeDisplay() {
    const modeText = hosMode === '70_8' ? '70HR/8Day' : '70HR/7Day';
    document.getElementById('hosModeValue').textContent = modeText;
    document.getElementById('weeklyLimit').textContent = `${getMaxWeeklyHours()}-Hour/${getPeriodDays()}-Day`;
}

// Change driver status
function changeStatus(newStatus) {
    // If there's a current status running, save it
    if (statusStartTime) {
        saveCurrentStatus();
    }

    // Set new status
    currentStatus = newStatus;
    statusStartTime = Date.now();
    
    // Update display
    updateDisplay();
    
    // Start update interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(updateDisplay, 1000);
    
    // Add log entry
    addLogEntry(newStatus, 0);
    
    saveData();
}

// Save the current status and add time to counters
function saveCurrentStatus() {
    if (!statusStartTime) return;
    
    const duration = (Date.now() - statusStartTime) / (1000 * 60 * 60); // hours
    
    // Update counters based on status
    if (currentStatus === 'driving') {
        drivingHours += duration;
        onDutyHours += duration;
        weeklyHours += duration;
        timeSinceLastBreak += duration;
    } else if (currentStatus === 'on-duty') {
        onDutyHours += duration;
        weeklyHours += duration;
        timeSinceLastBreak += duration;
    } else if (currentStatus === 'off-duty' || currentStatus === 'sleeper') {
        // Break time - resets the 8-hour counter
        if (duration >= BREAK_DURATION) {
            timeSinceLastBreak = 0;
            lastBreakTime = Date.now();
        }
    }
    
    // Update the last log entry with duration
    if (logEntries.length > 0) {
        logEntries[logEntries.length - 1].duration = duration;
    }
}

// Update the display
function updateDisplay() {
    // Update current status
    const statusLabels = {
        'off-duty': 'Off Duty',
        'driving': 'Driving',
        'on-duty': 'On Duty (Not Driving)'
    };
    
    document.getElementById('statusValue').textContent = statusLabels[currentStatus];
    
    // Update duration
    if (statusStartTime) {
        const durationMs = Date.now() - statusStartTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('durationValue').textContent = `${hours}H ${minutes}M`;
    }
    
    // Calculate current hours including ongoing status
    let currentDriving = drivingHours;
    let currentDuty = onDutyHours;
    let currentWeekly = weeklyHours;
    let currentBreakTime = timeSinceLastBreak;
    
    if (statusStartTime) {
        const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
        
        if (currentStatus === 'driving') {
            currentDriving += ongoingDuration;
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
            currentBreakTime += ongoingDuration;
        } else if (currentStatus === 'on-duty') {
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
            currentBreakTime += ongoingDuration;
        }
    }
    
    // Update driving hours
    document.getElementById('drivingHours').textContent = currentDriving.toFixed(1);
    const drivingRemaining = Math.max(0, MAX_DRIVING_HOURS - currentDriving);
    document.getElementById('drivingRemaining').textContent = drivingRemaining.toFixed(1);
    const drivingPercent = Math.min(100, (currentDriving / MAX_DRIVING_HOURS) * 100);
    document.getElementById('drivingProgress').style.width = drivingPercent + '%';
    
    // Update duty hours
    document.getElementById('dutyHours').textContent = currentDuty.toFixed(1);
    const dutyRemaining = Math.max(0, MAX_DUTY_HOURS - currentDuty);
    document.getElementById('dutyRemaining').textContent = dutyRemaining.toFixed(1);
    const dutyPercent = Math.min(100, (currentDuty / MAX_DUTY_HOURS) * 100);
    document.getElementById('dutyProgress').style.width = dutyPercent + '%';
    
    // Update break status
    document.getElementById('timeSinceBreak').textContent = currentBreakTime.toFixed(1);
    const breakWarning = document.getElementById('breakWarning');
    if (currentBreakTime >= BREAK_REQUIRED_AFTER) {
        breakWarning.classList.remove('hidden');
    } else {
        breakWarning.classList.add('hidden');
    }
    
    // Update weekly hours
    const maxWeekly = getMaxWeeklyHours();
    document.getElementById('weeklyHours').textContent = currentWeekly.toFixed(1);
    const weeklyRemaining = Math.max(0, maxWeekly - currentWeekly);
    document.getElementById('weeklyRemaining').textContent = weeklyRemaining.toFixed(1);
    const weeklyPercent = Math.min(100, (currentWeekly / maxWeekly) * 100);
    document.getElementById('weeklyProgress').style.width = weeklyPercent + '%';
    
    // Calculate and display next reset time
    calculateNextReset();
}

// Calculate when hours will reset
function calculateNextReset() {
    const resetInfo = document.getElementById('resetInfo');
    
    // Check if eligible for 34-hour restart
    const offDutyPeriods = logEntries.filter(entry => 
        (entry.status === 'off-duty' || entry.status === 'sleeper') && 
        entry.duration >= 0
    );
    
    let longestOffDuty = 0;
    let resetEligible = false;
    
    if (offDutyPeriods.length > 0) {
        longestOffDuty = Math.max(...offDutyPeriods.map(p => p.duration));
        if (longestOffDuty >= RESTART_HOURS) {
            resetEligible = true;
        }
    }
    
    // Calculate hours until 34-hour restart if currently off-duty
    if (currentStatus === 'off-duty' && statusStartTime) {
        const currentOffDutyHours = (Date.now() - statusStartTime) / (1000 * 60 * 60);
        const hoursToRestart = Math.max(0, RESTART_HOURS - currentOffDutyHours);
        
        if (hoursToRestart > 0) {
            const hoursRemaining = Math.floor(hoursToRestart);
            const minutesRemaining = Math.round((hoursToRestart - hoursRemaining) * 60);
            resetInfo.innerHTML = `
                <strong>⏱️ 34-Hour Restart Progress:</strong><br>
                ${hoursRemaining}h ${minutesRemaining}m remaining until full restart
            `;
            resetInfo.className = 'reset-info warning';
        } else {
            resetInfo.innerHTML = `
                <strong>✅ 34-Hour Restart Complete!</strong><br>
                Your hours are now fully reset. You can start with fresh limits.
            `;
            resetInfo.className = 'reset-info success';
        }
    } else if (resetEligible) {
        resetInfo.innerHTML = `
            <strong>✅ Last Restart:</strong> ${longestOffDuty.toFixed(1)} hours off-duty<br>
            Your weekly hours have been reset.
        `;
        resetInfo.className = 'reset-info success';
    } else {
        const maxWeekly = getMaxWeeklyHours();
        const hoursUsed = weeklyHours + (statusStartTime && (currentStatus === 'driving' || currentStatus === 'on-duty') 
            ? (Date.now() - statusStartTime) / (1000 * 60 * 60) 
            : 0);
        
        resetInfo.innerHTML = `
            <strong>ℹ️ Reset Information:</strong><br>
            Need ${RESTART_HOURS} consecutive hours off-duty for a full restart.<br>
            Current ${getPeriodDays()}-day hours: ${hoursUsed.toFixed(1)}/${maxWeekly}
        `;
        resetInfo.className = 'reset-info info';
    }
}

// Add log entry
function addLogEntry(status, duration) {
    const entry = {
        status: status,
        timestamp: Date.now(),
        duration: duration
    };
    logEntries.push(entry);
    renderLog();
    saveData();
}

// Render log entries
function renderLog() {
    const container = document.getElementById('logContainer');
    
    if (logEntries.length === 0) {
        container.innerHTML = '<p class="no-logs">No entries yet. Change your status to begin tracking.</p>';
        return;
    }
    
    const statusLabels = {
        'off-duty': 'Off Duty',
        'driving': 'Driving',
        'on-duty': 'On Duty (Not Driving)'
    };
    
    let html = '';
    for (let i = logEntries.length - 1; i >= 0; i--) {
        const entry = logEntries[i];
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleString();
        
        const hours = Math.floor(entry.duration);
        const minutes = Math.round((entry.duration - hours) * 60);
        const durationStr = entry.duration > 0 ? `Duration: ${hours}H ${minutes}M` : 'Ongoing...';
        
        html += `
            <div class="log-entry">
                <div class="log-time">${timeStr}</div>
                <div class="log-status">${statusLabels[entry.status]}</div>
                <div class="log-duration">${durationStr}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Edit existing trip - populate form
function editTrip(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    // Store the trip ID being edited
    editingTripId = tripId;
    
    // Populate all form fields
    document.getElementById('trip_miles').value = trip.miles;
    document.getElementById('trip_avgSpeed').value = trip.avgSpeedMph;
    document.getElementById('trip_duration').value = trip.tripDurationDays || 1;
    document.getElementById('trip_pickupTime').value = trip.pickupTime || '';
    updateGarageTimeDisplay(); // Update garage time based on pickup
    document.getElementById('trip_dropoffTime').value = trip.dropoffTime || '';
    document.getElementById('trip_returnPickupTime').value = trip.returnPickupTime || '';
    document.getElementById('trip_returnDropoffTime').value = trip.returnDropoffTime || '';
    document.getElementById('trip_deadhead').value = trip.deadheadMiles || 0;
    
    // Populate pay fields
    document.getElementById('driver_type').value = trip.driverType || 'full-time';
    toggleDriverType(); // Show correct fields
    
    if (trip.driverType === 'full-time') {
        document.getElementById('trip_type').value = trip.tripType || 'contract';
    } else if (trip.driverType === 'part-time') {
        document.getElementById('vehicle_type').value = trip.vehicleType || 'sedan-suv';
    }
    
    document.getElementById('trip_revenue').value = trip.tripRevenue || 0;
    document.getElementById('trip_safetyEligible').checked = trip.isSafetyEligible || false;
    document.getElementById('trip_includesRelay').checked = trip.includesRelay || false;
    
    // Change button text to indicate editing
    const addBtn = document.querySelector('.add-trip-btn');
    addBtn.textContent = '✏️ Update Trip';
    addBtn.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    
    // Scroll to form
    document.querySelector('.trip-input-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel editing
function cancelEdit() {
    editingTripId = null;
    
    // Reset button
    const addBtn = document.querySelector('.add-trip-btn');
    addBtn.textContent = '➕ Add Trip to Schedule';
    addBtn.style.background = '';
    
    // Clear form
    document.getElementById('trip_miles').value = '';
    document.getElementById('trip_pickupTime').value = '';
    document.getElementById('trip_dropoffTime').value = '';
    document.getElementById('trip_returnPickupTime').value = '';
    document.getElementById('trip_returnDropoffTime').value = '';
}

// Add trip to multi-trip planner
function addTrip() {
    const startDate = document.getElementById('trip_startDate').value;
    const endDate = document.getElementById('trip_endDate').value;
    const miles = parseFloat(document.getElementById('trip_miles').value);
    const avgSpeed = parseFloat(document.getElementById('trip_avgSpeed').value);
    const tripDuration = parseFloat(document.getElementById('trip_duration').value) || 1;
    const pickupTime = document.getElementById('trip_pickupTime').value;
    const dropoffTime = document.getElementById('trip_dropoffTime').value;
    const returnPickupTime = document.getElementById('trip_returnPickupTime').value;
    const returnDropoffTime = document.getElementById('trip_returnDropoffTime').value;
    const preTrip = 15; // Always 15 minutes
    const postTrip = 15; // Always 15 minutes
    const deadhead = parseFloat(document.getElementById('trip_deadhead').value) || 0;
    
    // Pay inputs
    const driverType = document.getElementById('driver_type').value;
    const tripType = driverType === 'full-time' ? document.getElementById('trip_type').value : null;
    const vehicleType = driverType === 'part-time' ? document.getElementById('vehicle_type').value : null;
    const tripRevenue = parseFloat(document.getElementById('trip_revenue').value) || 0;
    const isSafetyEligible = document.getElementById('trip_safetyEligible').checked;
    const includesRelay = document.getElementById('trip_includesRelay').checked;
    
    if (!miles || miles <= 0 || !avgSpeed || avgSpeed <= 0) {
        alert('Please enter valid trip distance and average speed.');
        return;
    }
    
    if (!pickupTime) {
        alert('Please enter a pickup time.');
        return;
    }
    
    if (!dropoffTime) {
        alert('Please enter a drop-off time.');
        return;
    }
    
    // Calculate garage arrival time and spot arrival time if pickup time is provided
    let garageArrivalTime = null;
    let spotArrivalTime = null;
    if (pickupTime) {
        // Parse pickup time (when passengers board)
        const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
        const pickupMinutes = pickupHour * 60 + pickupMinute;
        
        // Calculate spot arrival time (always 15 minutes BEFORE pickup)
        const spotMinutes = pickupMinutes - 15;
        let spotHour = Math.floor(spotMinutes / 60);
        let spotMin = spotMinutes % 60;
        let spotPrevDay = false;
        
        if (spotMinutes < 0) {
            // Previous day
            const totalMins = 1440 + spotMinutes;
            spotHour = Math.floor(totalMins / 60);
            spotMin = totalMins % 60;
            spotPrevDay = true;
        }
        
        spotArrivalTime = `${String(spotHour).padStart(2, '0')}:${String(spotMin).padStart(2, '0')}${spotPrevDay ? ' (prev day)' : ''}`;
        
        // Calculate garage arrival time (always 1 HOUR before pickup)
        const garageMinutes = pickupMinutes - 60;
        let garageHour = Math.floor(garageMinutes / 60);
        let garageMin = garageMinutes % 60;
        let garagePrevDay = false;
        
        if (garageMinutes < 0) {
            // Previous day
            const totalMins = 1440 + garageMinutes;
            garageHour = Math.floor(totalMins / 60);
            garageMin = totalMins % 60;
            garagePrevDay = true;
        }
        
        garageArrivalTime = `${String(garageHour).padStart(2, '0')}:${String(garageMin).padStart(2, '0')}${garagePrevDay ? ' (prev day)' : ''}`;
    }
    
    // Calculate trip hours using DOT formula
    const driveTimeHours = miles / avgSpeed;
    const deadheadDriveHours = deadhead ? deadhead / avgSpeed : 0;
    
    // Total on-duty time includes:
    // - Pre-trip inspection (default 15 min)
    // - Spot time buffer (15 minutes before pickup - already included)
    // - Actual trip driving time
    // - Post-trip inspection
    // - Deadhead driving
    const onDutyTimeHours = (preTrip + 15 + postTrip) / 60 + driveTimeHours + deadheadDriveHours;
    
    // Validate against DOT limits
    const exceedsDriveLimit = (driveTimeHours + deadheadDriveHours) > 10;
    const exceedsOnDutyLimit = onDutyTimeHours > 15;
    const weeklyLimit = hosMode === "70_8" ? 70 : 60;
    const exceedsWeeklyLimit = (weeklyHours + onDutyTimeHours) > weeklyLimit;
    
    // Check if deadhead repositioning could fix the problem
    const canFixWithDeadhead = 
        (deadheadDriveHours + driveTimeHours) <= 10 &&
        (deadheadDriveHours + driveTimeHours) <= 15;
    
    // Calculate relay point
    const relayPointMiles = 10 * avgSpeed;
    const relayRequired = relayPointMiles < miles;
    
    // Check if hotel overnight could fix the problem
    const hotelRequired = exceedsOnDutyLimit && onDutyTimeHours <= 16;
    
    // Determine trip status
    let tripStatus;
    if (!exceedsDriveLimit && !exceedsOnDutyLimit && !exceedsWeeklyLimit) {
        tripStatus = "LEGAL";
    } else if (canFixWithDeadhead) {
        tripStatus = "DEADHEAD_REQUIRED";
    } else if (hotelRequired) {
        tripStatus = "HOTEL_REQUIRED";
    } else if (relayRequired) {
        tripStatus = "RELAY_REQUIRED";
    } else {
        tripStatus = "TRIP_NOT_POSSIBLE_UNDER_DOT";
    }
    
    // Warning for trips that exceed daily limits
    if (exceedsDriveLimit || exceedsOnDutyLimit) {
        const warnings = [];
        if (exceedsDriveLimit) {
            warnings.push(`⚠️ Drive time (${(driveTimeHours + deadheadDriveHours).toFixed(1)}h) exceeds 10-hour limit`);
        }
        if (exceedsOnDutyLimit) {
            warnings.push(`⚠️ On-duty time (${onDutyTimeHours.toFixed(1)}h) exceeds 15-hour limit`);
        }
        
        let message = `WARNING: This trip exceeds DOT limits!\n\n${warnings.join('\n')}\n`;
        message += `Status: ${tripStatus}\n\n`;
        
        // Provide solutions based on status
        if (tripStatus === "DEADHEAD_REQUIRED") {
            if (deadhead === 0 && driveTimeHours > 10) {
                const excessMiles = (driveTimeHours - 10) * avgSpeed;
                message += `💡 SOLUTION: Deadhead Repositioning\n` +
                          `Add ${excessMiles.toFixed(0)} miles of deadhead the day before.\n` +
                          `This makes the passenger trip ${(10 * avgSpeed).toFixed(0)} miles (10 hours) - LEGAL!\n\n`;
            } else if (deadhead > 0 && canFixWithDeadhead) {
                message += `💡 SOLUTION: Split Deadhead to Separate Day\n` +
                          `Day 1: Deadhead ${deadhead} miles (${deadheadDriveHours.toFixed(1)}h)\n` +
                          `Day 2: Passenger trip ${miles} miles (${driveTimeHours.toFixed(1)}h) - LEGAL!\n\n`;
            }
        } else if (tripStatus === "RELAY_REQUIRED" && relayRequired) {
            message += `💡 SOLUTION: Driver Relay Required\n` +
                      `Relay Point: ${relayPointMiles.toFixed(0)} miles from start\n` +
                      `Driver 1: 0 to ${relayPointMiles.toFixed(0)} miles (10 hours max)\n` +
                      `Driver 2: ${relayPointMiles.toFixed(0)} to ${miles.toFixed(0)} miles (${(miles - relayPointMiles).toFixed(0)} miles)\n\n`;
        } else if (tripStatus === "TRIP_NOT_POSSIBLE_UNDER_DOT") {
            message += `❌ This trip cannot be completed legally under current DOT regulations.\n` +
                      `Consider breaking it into multiple shorter trips or using multiple drivers.\n\n`;
        }
        
        message += `Do you want to add it anyway for planning purposes?`;
        
        const proceed = confirm(message);
        
        if (!proceed) return;
    }
    
    // Calculate pay if revenue provided
    let payBreakdown = null;
    if (tripRevenue > 0) {
        const includesDeadhead = deadhead > 0;
        const relayDurationHours = includesRelay ? (relayRequired ? 10 : 0) : 0;
        
        payBreakdown = calculateTripPay({
            driverType: driverType,
            tripType: tripType,
            vehicleType: vehicleType,
            tripRevenue: tripRevenue,
            tripDurationHours: onDutyTimeHours,
            includesDeadhead: includesDeadhead,
            deadheadDurationHours: deadheadDriveHours,
            includesRelay: includesRelay,
            relayDurationHours: relayDurationHours,
            isSafetyEligible: isSafetyEligible
        });
    }
    
    // Check if we're editing or adding new
    const tripId = editingTripId || Date.now();
    const isEditing = editingTripId !== null;
    
    const trip = {
        id: tripId,
        startDate: startDate,
        endDate: endDate,
        miles: miles,
        avgSpeedMph: avgSpeed,
        tripDurationDays: tripDuration,
        pickupTime: pickupTime,
        dropoffTime: dropoffTime,
        returnPickupTime: returnPickupTime,
        returnDropoffTime: returnDropoffTime,
        spotArrivalTime: spotArrivalTime,
        garageArrivalTime: garageArrivalTime,
        preTripMinutes: preTrip,
        postTripMinutes: postTrip,
        deadheadMiles: deadhead,
        deadheadSpeedMph: avgSpeed,
        driverType: driverType,
        tripType: tripType,
        vehicleType: vehicleType,
        tripRevenue: tripRevenue,
        isSafetyEligible: isSafetyEligible,
        includesRelay: includesRelay,
        payBreakdown: payBreakdown,
        addedAt: Date.now(),
        status: tripStatus || "LEGAL",
        exceedsDriveLimit: exceedsDriveLimit,
        exceedsOnDutyLimit: exceedsOnDutyLimit
    };
    
    if (isEditing) {
        // Update existing trip
        const index = trips.findIndex(t => t.id === tripId);
        if (index !== -1) {
            trips[index] = trip;
        }
        editingTripId = null;
        
        // Reset button
        const addBtn = document.querySelector('.add-trip-btn');
        addBtn.textContent = '➕ Add Trip to Schedule';
        addBtn.style.background = '';
    } else {
        // Add new trip
        trips.push(trip);
    }
    
    renderTrips();
    calculateMultiTripPlan();
    updateDashboardStats();
    saveData();
    
    // Clear form
    document.getElementById('trip_miles').value = '';
    document.getElementById('trip_pickupTime').value = '';
    document.getElementById('trip_dropoffTime').value = '';
    document.getElementById('trip_returnPickupTime').value = '';
    document.getElementById('trip_returnDropoffTime').value = '';
    document.getElementById('trip_deadhead').value = '';
    document.getElementById('trip_revenue').value = '';
    document.getElementById('trip_garageTime').value = '';
    document.getElementById('trip_spotTime_display').value = '';
}

// Remove trip
function removeTrip(tripId) {
    trips = trips.filter(t => t.id !== tripId);
    renderTrips();
    calculateMultiTripPlan();
    updateDashboardStats();
    saveData();
}

// Render trips
function renderTrips() {
    const container = document.getElementById('tripsContainer');
    
    if (trips.length === 0) {
        container.innerHTML = '<p class="no-logs">No trips added yet. Add trips to plan your schedule.</p>';
        return;
    }
    
    let html = '<div class="trips-list">';
    trips.forEach((trip, index) => {
        const drivingTime = trip.miles / trip.avgSpeedMph;
        
        // Calculate front and back deadhead times separately
        const frontDeadheadTime = trip.frontDeadheadMiles ? trip.frontDeadheadMiles / (trip.frontDeadheadSpeed || trip.avgSpeedMph) : 0;
        const backDeadheadTime = trip.backDeadheadMiles ? trip.backDeadheadMiles / (trip.backDeadheadSpeed || trip.avgSpeedMph) : 0;
        const totalDeadheadTime = frontDeadheadTime + backDeadheadTime;
        
        // Legacy support for old deadhead format
        const legacyDeadheadTime = trip.deadheadMiles ? trip.deadheadMiles / (trip.deadheadSpeedMph || trip.avgSpeedMph) : 0;
        const deadheadTime = totalDeadheadTime > 0 ? totalDeadheadTime : legacyDeadheadTime;
        
        const totalDriving = drivingTime + deadheadTime;
        const totalOnDuty = totalDriving + ((trip.preTripMinutes || 0) + 15 + (trip.postTripMinutes || 0)) / 60;
        
        const statusBadge = trip.status ? `<span class="status-badge ${trip.status.toLowerCase()}">${trip.status.replace(/_/g, ' ')}</span>` : '';
        
        html += `
            <div class="trip-card ${trip.exceedsDriveLimit || trip.exceedsOnDutyLimit ? 'exceeds-limits' : ''}" onclick="editTrip(${trip.id})" style="cursor: pointer;" title="Click to edit this trip">
                <div class="trip-header">
                    <h4>Trip ${index + 1} ${statusBadge}</h4>
                    <button class="remove-btn" onclick="event.stopPropagation(); removeTrip(${trip.id})">×</button>
                </div>
                <div class="trip-details">
                    ${trip.tripDurationDays > 1 ? `
                    <div class="trip-row highlight" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 3px solid #2196f3;">
                        <span>📅 Trip Duration:</span>
                        <span><strong>${trip.tripDurationDays} Day${trip.tripDurationDays > 1 ? 's' : ''}</strong></span>
                    </div>
                    ` : ''}
                    ${trip.garageArrivalTime ? `
                    <div class="trip-row highlight">
                        <span>🏢 Garage Arrival:</span>
                        <span><strong>${trip.garageArrivalTime}</strong></span>
                    </div>
                    <div class="trip-row highlight">
                        <span>📍 Spot Arrival (15 min early):</span>
                        <span><strong>${trip.spotArrivalTime}</strong></span>
                    </div>
                    <div class="trip-row highlight">
                        <span>👥 Passenger Pickup:</span>
                        <span><strong>${trip.pickupTime}</strong></span>
                    </div>
                    ${trip.dropoffTime ? `
                    <div class="trip-row highlight">
                        <span>🏁 Passenger Drop-off:</span>
                        <span><strong>${trip.dropoffTime}</strong></span>
                    </div>
                    ` : ''}
                    ${trip.returnPickupTime ? `
                    <div class="trip-row highlight" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 3px solid #4caf50;">
                        <span>🔄 Return Pickup:</span>
                        <span><strong>${trip.returnPickupTime}</strong></span>
                    </div>
                    ` : ''}
                    ${trip.returnDropoffTime ? `
                    <div class="trip-row highlight" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 3px solid #4caf50;">
                        <span>🏁 Return Drop-off:</span>
                        <span><strong>${trip.returnDropoffTime}</strong></span>
                    </div>
                    ` : ''}
                    ` : ''}
                    <div class="trip-row">
                        <span>🚌 Passenger Miles:</span>
                        <span>${trip.miles.toFixed(1)} mi @ ${trip.avgSpeedMph} mph</span>
                    </div>
                    ${trip.frontDeadheadMiles > 0 ? `
                    <div class="trip-row" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 3px solid #10b981;">
                        <span>🚛 Front-End Deadhead:</span>
                        <span>${trip.frontDeadheadMiles.toFixed(1)} mi @ ${trip.frontDeadheadSpeed} mph (${formatHours(frontDeadheadTime)})</span>
                    </div>
                    ` : ''}
                    ${trip.backDeadheadMiles > 0 ? `
                    <div class="trip-row" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 3px solid #f59e0b;">
                        <span>🚛 Back-End Deadhead:</span>
                        <span>${trip.backDeadheadMiles.toFixed(1)} mi @ ${trip.backDeadheadSpeed} mph (${formatHours(backDeadheadTime)})</span>
                    </div>
                    ` : ''}
                    ${trip.deadheadMiles > 0 && !trip.frontDeadheadMiles ? `
                    <div class="trip-row">
                        <span>🚛 Deadhead (Legacy):</span>
                        <span>${trip.deadheadMiles.toFixed(1)} mi @ ${trip.deadheadSpeedMph} mph</span>
                    </div>
                    ` : ''}
                    ${trip.frontRelayRequired ? `
                    <div class="trip-row" style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-left: 3px solid #8b5cf6;">
                        <span>🔄 Front-End Relay:</span>
                        <span>YES${trip.frontRelayLocation ? ` at ${trip.frontRelayLocation}` : ''}</span>
                    </div>
                    ` : ''}
                    ${trip.backRelayRequired ? `
                    <div class="trip-row" style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border-left: 3px solid #ec4899;">
                        <span>🔄 Back-End Relay:</span>
                        <span>YES${trip.backRelayLocation ? ` at ${trip.backRelayLocation}` : ''}</span>
                    </div>
                    ` : ''}
                    ${trip.relayRequired && !trip.frontRelayRequired && !trip.backRelayRequired ? `
                    <div class="trip-row">
                        <span>🔄 Relay (Legacy):</span>
                        <span>YES${trip.relayLocation ? ` at ${trip.relayLocation}` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="trip-row">
                        <span>⏱️ Total Driving Time:</span>
                        <span><strong>${formatHours(totalDriving)}</strong></span>
                    </div>
                    <div class="trip-row">
                        <span>📋 Total On-Duty Time:</span>
                        <span><strong>${formatHours(totalOnDuty)}</strong></span>
                    </div>
                    ${trip.preTripMinutes > 0 || trip.postTripMinutes > 0 ? `
                    <div class="trip-row small">
                        <span>└ Pre: ${trip.preTripMinutes || 0}m, Spot: 15m, Post: ${trip.postTripMinutes || 0}m</span>
                    </div>
                    ` : ''}
                    ${trip.payBreakdown ? `
                    <div class="pay-section">
                        <div class="pay-header">💰 Estimated Earnings ${trip.driverType ? '(' + trip.driverType + ')' : ''}</div>
                        <div class="trip-row pay-row">
                            <span>${trip.payBreakdown.payLabel || 'Base Pay'}:</span>
                            <span>$${trip.payBreakdown.basePay}</span>
                        </div>
                        ${parseFloat(trip.payBreakdown.safetyBonus) > 0 ? `
                        <div class="trip-row pay-row">
                            <span>Safety/Compliance (4%):</span>
                            <span>$${trip.payBreakdown.safetyBonus}</span>
                        </div>
                        ` : ''}
                        ${parseFloat(trip.payBreakdown.deadheadPay) > 0 ? `
                        <div class="trip-row pay-row">
                            <span>Deadhead Pay:</span>
                            <span>$${trip.payBreakdown.deadheadPay}</span>
                        </div>
                        ` : ''}
                        ${parseFloat(trip.payBreakdown.relayPay) > 0 ? `
                        <div class="trip-row pay-row">
                            <span>Relay Pay:</span>
                            <span>$${trip.payBreakdown.relayPay}</span>
                        </div>
                        ` : ''}
                        <div class="trip-row pay-row total-pay">
                            <span><strong>Total Trip Pay:</strong></span>
                            <span><strong>$${trip.payBreakdown.totalPay}</strong></span>
                        </div>
                    </div>
                    ` : trip.tripRevenue > 0 ? `
                    <div class="trip-row pay-row">
                        <span>💰 Revenue:</span>
                        <span>$${trip.tripRevenue.toFixed(2)} (${trip.tripType})</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Format hours to h:mm
function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
}

// Calculate multi-trip plan
function calculateMultiTripPlan() {
    if (trips.length === 0) {
        document.getElementById('multiTripResults').classList.add('hidden');
        return;
    }
    
    const results = document.getElementById('multiTripResults');
    results.classList.remove('hidden');
    
    // Get current hours
    let currentDriving = drivingHours;
    let currentDuty = onDutyHours;
    let currentWeekly = weeklyHours;
    
    if (statusStartTime) {
        const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
        if (currentStatus === 'driving') {
            currentDriving += ongoingDuration;
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
        } else if (currentStatus === 'on-duty') {
            currentDuty += ongoingDuration;
            currentWeekly += ongoingDuration;
        }
    }
    
    // Simulate trips
    let schedule = [];
    let day = 1;
    let dayDriving = currentDriving;
    let dayDuty = currentDuty;
    let weeklyAccum = currentWeekly;
    let tripIndex = 0;
    
    const maxWeekly = getMaxWeeklyHours();
    const periodDays = getPeriodDays();
    
    while (tripIndex < trips.length && day <= 14) {
        const trip = trips[tripIndex];
        
        const drivingTime = trip.miles / trip.avgSpeedMph;
        const deadheadTime = trip.deadheadMiles ? trip.deadheadMiles / (trip.deadheadSpeedMph || trip.avgSpeedMph) : 0;
        const totalDriving = drivingTime + deadheadTime;
        const totalOnDuty = totalDriving + ((trip.preTripMinutes || 0) + 15 + (trip.postTripMinutes || 0)) / 60;
        
        // Check if trip fits in daily limits
        const fitsDaily = (dayDriving + totalDriving <= MAX_DRIVING_HOURS) && 
                         (dayDuty + totalOnDuty <= MAX_DUTY_HOURS);
        
        // Check if trip fits in weekly limit
        const fitsWeekly = (weeklyAccum + totalOnDuty <= maxWeekly);
        
        if (fitsDaily && fitsWeekly) {
            // Trip can be completed today
            schedule.push({
                day: day,
                tripNum: tripIndex + 1,
                action: 'trip',
                driving: totalDriving,
                onDuty: totalOnDuty,
                miles: trip.miles + (trip.deadheadMiles || 0)
            });
            
            dayDriving += totalDriving;
            dayDuty += totalOnDuty;
            weeklyAccum += totalOnDuty;
            tripIndex++;
        } else if (!fitsWeekly) {
            // Need 34-hour restart
            schedule.push({
                day: day,
                tripNum: null,
                action: 'restart',
                restHours: RESTART_HOURS
            });
            
            // Reset after 34 hours (approximately 1.5 days)
            day += 2;
            dayDriving = 0;
            dayDuty = 0;
            weeklyAccum = 0;
        } else {
            // Need daily reset (10 consecutive hours off)
            schedule.push({
                day: day,
                tripNum: null,
                action: 'daily_reset',
                restHours: 10
            });
            
            day++;
            dayDriving = 0;
            dayDuty = 0;
        }
        
        // Safety check
        if (schedule.length > 50) break;
    }
    
    // Render schedule
    renderSchedule(schedule);
}

// Render schedule
function renderSchedule(schedule) {
    const container = document.getElementById('scheduleDisplay');
    
    // Get start date from first trip or use today
    let startDate = new Date();
    if (trips.length > 0 && trips[0].startDate) {
        startDate = new Date(trips[0].startDate + 'T00:00:00');
    }
    
    let html = '<div class="schedule-timeline">';
    let currentDay = 0;
    
    schedule.forEach((item, index) => {
        if (item.day !== currentDay) {
            if (currentDay > 0) {
                html += '</div>'; // Close previous day
            }
            
            // Calculate actual calendar date for this day
            const actualDate = new Date(startDate);
            actualDate.setDate(startDate.getDate() + (item.day - 1));
            
            const dayOfWeek = actualDate.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDay = actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            html += `<div class="day-section">
                <div class="day-header">
                    <div style="font-size: 1.2em; font-weight: bold;">Day ${item.day}</div>
                    <div style="font-size: 0.95em; color: #666; margin-top: 4px;">${dayOfWeek}, ${monthDay}</div>
                </div>
                <div class="day-events">`;
            currentDay = item.day;
        }
        
        if (item.action === 'trip') {
            html += `
                <div class="event-card trip-event">
                    <div class="event-icon">🚌</div>
                    <div class="event-content">
                        <strong>Trip ${item.tripNum}</strong>
                        <div class="event-details">
                            ${item.miles.toFixed(1)} mi • ${formatHours(item.driving)} driving • ${formatHours(item.onDuty)} on-duty
                        </div>
                    </div>
                </div>
            `;
        } else if (item.action === 'restart') {
            html += `
                <div class="event-card rest-event restart">
                    <div class="event-icon">🔄</div>
                    <div class="event-content">
                        <strong>34-Hour Restart</strong>
                        <div class="event-details">
                            Full reset of ${getMaxWeeklyHours()}-hour period
                        </div>
                    </div>
                </div>
            `;
        } else if (item.action === 'daily_reset') {
            html += `
                <div class="event-card rest-event">
                    <div class="event-icon">😴</div>
                    <div class="event-content">
                        <strong>10-Hour Rest Period</strong>
                        <div class="event-details">
                            Daily reset for next duty period
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div></div></div>'; // Close last day and timeline
    
    // Calculate totals
    const totalDays = schedule.length > 0 ? schedule[schedule.length - 1].day : 0;
    const completedTrips = schedule.filter(s => s.action === 'trip').length;
    const restarts = schedule.filter(s => s.action === 'restart').length;
    
    // Calculate total earnings from trips with pay data
    let totalTripEarnings = 0;
    let tripsWithPay = 0;
    let hasFullTimeDrivers = false;
    trips.forEach((trip, index) => {
        if (index < completedTrips && trip.payBreakdown) {
            totalTripEarnings += parseFloat(trip.payBreakdown.totalPay);
            tripsWithPay++;
            if (trip.driverType === 'full-time') {
                hasFullTimeDrivers = true;
            }
        }
    });
    
    // Calculate number of weeks in schedule (only for full-time drivers)
    const weeksInSchedule = Math.ceil(totalDays / 7);
    const weeklySalaryTotal = hasFullTimeDrivers ? WEEKLY_SALARY * weeksInSchedule : 0;
    const grandTotal = weeklySalaryTotal + totalTripEarnings;
    
    const summary = `
        <div class="schedule-summary">
            <h4>📊 Schedule Summary</h4>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Days:</span>
                    <span class="summary-value">${totalDays}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Trips Completed:</span>
                    <span class="summary-value">${completedTrips} / ${trips.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">34-Hour Restarts:</span>
                    <span class="summary-value">${restarts}</span>
                </div>
                ${tripsWithPay > 0 && hasFullTimeDrivers ? `
                <div class="summary-item">
                    <span class="summary-label">💵 Weekly Salary (FT):</span>
                    <span class="summary-value" style="color: #047857;">$${weeklySalaryTotal.toFixed(2)}</span>
                </div>
                ` : ''}
                ${tripsWithPay > 0 ? `
                <div class="summary-item">
                    <span class="summary-label">💰 Trip Earnings:</span>
                    <span class="summary-value" style="color: #047857;">$${totalTripEarnings.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">🤑 GRAND TOTAL:</span>
                    <span class="summary-value" style="color: #047857; font-size: 1.8em;">$${grandTotal.toFixed(2)}</span>
                </div>
                ` : ''}
            </div>
            ${completedTrips < trips.length ? `
                <div class="warning-box">
                    ⚠️ Could not fit all trips within 14 days. Consider optimizing trip timing or reducing trip count.
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = summary + html;
}

// Calculate trip feasibility (single trip)
function calculateTrip() {
    const mileage = parseFloat(document.getElementById('mileageInput').value);
    const speed = parseFloat(document.getElementById('speedInput').value);
    
    if (!mileage || mileage <= 0) {
        alert('Please enter a valid trip distance in miles.');
        return;
    }
    
    if (!speed || speed <= 0) {
        alert('Please enter a valid average speed.');
        return;
    }
    
    // Calculate travel time
    const travelTime = mileage / speed;
    
    // Check for manual hours input (for planning)
    const manualDriving = parseFloat(document.getElementById('manualDrivingInput').value);
    const manualDuty = parseFloat(document.getElementById('manualDutyInput').value);
    const manualBreak = parseFloat(document.getElementById('manualBreakInput').value);
    
    let currentDriving, currentDuty, currentBreakTime;
    
    // Use manual hours if provided, otherwise use tracked hours
    if (!isNaN(manualDriving) && manualDriving >= 0) {
        currentDriving = manualDriving;
    } else {
        currentDriving = drivingHours;
        if (statusStartTime && currentStatus === 'driving') {
            const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
            currentDriving += ongoingDuration;
        }
    }
    
    if (!isNaN(manualDuty) && manualDuty >= 0) {
        currentDuty = manualDuty;
    } else {
        currentDuty = onDutyHours;
        if (statusStartTime) {
            const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
            if (currentStatus === 'driving' || currentStatus === 'on-duty') {
                currentDuty += ongoingDuration;
            }
        }
    }
    
    if (!isNaN(manualBreak) && manualBreak >= 0) {
        currentBreakTime = manualBreak;
    } else {
        currentBreakTime = timeSinceLastBreak;
        if (statusStartTime) {
            const ongoingDuration = (Date.now() - statusStartTime) / (1000 * 60 * 60);
            if (currentStatus === 'driving' || currentStatus === 'on-duty') {
                currentBreakTime += ongoingDuration;
            }
        }
    }
    
    const availableDriving = Math.max(0, MAX_DRIVING_HOURS - currentDriving);
    const availableDuty = Math.max(0, MAX_DUTY_HOURS - currentDuty);
    
    // Show results
    const resultsDiv = document.getElementById('tripResults');
    resultsDiv.classList.remove('hidden');
    
    document.getElementById('resultDistance').textContent = `${mileage} miles`;
    
    const hours = Math.floor(travelTime);
    const minutes = Math.round((travelTime - hours) * 60);
    document.getElementById('resultTime').textContent = `${hours}h ${minutes}m (at ${speed} mph)`;
    document.getElementById('resultAvailable').textContent = `${availableDriving.toFixed(1)} hours`;
    
    // Generate recommendation
    const recommendationDiv = document.getElementById('recommendation');
    let recommendationHTML = '';
    let recommendationClass = '';
    
    // Check if trip is feasible
    const totalTimeNeeded = travelTime + BREAK_DURATION; // Include break time
    
    if (availableDriving >= travelTime && availableDuty >= totalTimeNeeded) {
        // Trip is feasible
        recommendationClass = 'success';
        recommendationHTML = `
            <strong>✅ Trip is Feasible!</strong>
            You have sufficient hours to complete this trip today. 
            ${timeSinceLastBreak >= BREAK_REQUIRED_AFTER ? 'Remember to take your 30-minute break before or during the trip.' : ''}
        `;
    } else if (availableDriving < travelTime) {
        // Not enough driving hours
        const shortfall = travelTime - availableDriving;
        const shortfallHours = Math.floor(shortfall);
        const shortfallMinutes = Math.round((shortfall - shortfallHours) * 60);
        
        recommendationClass = 'danger';
        recommendationHTML = `
            <strong>⚠️ Insufficient Driving Hours!</strong>
            You are short by <strong>${shortfallHours}h ${shortfallMinutes}m</strong> of driving time.<br><br>
            
            <strong>Recommendations:</strong><br>
            🚛 <strong>Dead Head Option:</strong> Move the bus closer to the destination the day before (empty, no passengers). 
            This would reduce tomorrow's trip by ${Math.round(shortfall * speed)} miles.<br><br>
            
            🔄 <strong>Relay Option:</strong> Coordinate with another driver to hand off mid-route after you've driven 
            ${Math.round(availableDriving * speed)} miles (approximately ${availableDriving.toFixed(1)} hours).<br><br>
            
            ⏰ <strong>Wait Until Tomorrow:</strong> After a 10-hour reset, you'll have fresh hours to complete the full trip.
        `;
    } else if (availableDuty < totalTimeNeeded) {
        // Not enough duty hours (but enough driving)
        recommendationClass = 'warning';
        recommendationHTML = `
            <strong>⚠️ Insufficient On-Duty Hours!</strong>
            While you have enough driving hours, your 15-hour on-duty window doesn't allow for this trip plus required breaks.<br><br>
            
            <strong>Recommendations:</strong><br>
            🔄 <strong>Relay Option:</strong> Hand off to another driver to complete the trip.<br><br>
            
            ⏰ <strong>Reset Required:</strong> Take your 10-hour off-duty break to reset for tomorrow.
        `;
    }
    
    recommendationDiv.className = `recommendation ${recommendationClass}`;
    recommendationDiv.innerHTML = recommendationHTML;
}

// Export log
function exportLog() {
    if (logEntries.length === 0) {
        alert('No log entries to export.');
        return;
    }
    
    let csvContent = 'Timestamp,Status,Duration (hours)\n';
    
    const statusLabels = {
        'off-duty': 'Off Duty',
        'driving': 'Driving',
        'on-duty': 'On Duty (Not Driving)'
    };
    
    logEntries.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleString();
        const status = statusLabels[entry.status];
        const duration = entry.duration.toFixed(2);
        csvContent += `"${date}","${status}",${duration}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dot-hours-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Clear all logs
function clearLog() {
    if (!confirm('Are you sure you want to clear all log entries? This cannot be undone.')) {
        return;
    }
    
    logEntries = [];
    renderLog();
    saveData();
}

// Reset for new day (10-hour reset)
function resetDay() {
    if (!confirm('Reset hours for a new day? This simulates a 10-hour off-duty reset.')) {
        return;
    }
    
    // Save current status before reset
    if (statusStartTime) {
        saveCurrentStatus();
    }
    
    // Reset daily counters
    drivingHours = 0;
    onDutyHours = 0;
    timeSinceLastBreak = 0;
    
    // Stop current status
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    currentStatus = 'off-duty';
    statusStartTime = null;
    
    // Keep weekly hours (they accumulate over period)
    
    updateDisplay();
    saveData();
    
    alert('Hours reset complete! You can start a new duty period.');
}

// Perform 34-hour restart
function perform34HourRestart() {
    if (!confirm('Perform a 34-hour restart? This will reset your weekly hours to zero.')) {
        return;
    }
    
    // Save current status
    if (statusStartTime) {
        saveCurrentStatus();
    }
    
    // Reset all counters
    drivingHours = 0;
    onDutyHours = 0;
    weeklyHours = 0;
    timeSinceLastBreak = 0;
    
    // Stop current status
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    currentStatus = 'off-duty';
    statusStartTime = null;
    
    // Add a log entry for the restart
    addLogEntry('off-duty', RESTART_HOURS);
    
    updateDisplay();
    saveData();
    
    alert('34-hour restart complete! All hours have been reset.');
}

// Save data to localStorage
function saveData() {
    const data = {
        currentStatus,
        statusStartTime,
        drivingHours,
        onDutyHours,
        weeklyHours,
        timeSinceLastBreak,
        lastBreakTime,
        logEntries,
        trips,
        hosMode
    };
    localStorage.setItem('dotHoursData', JSON.stringify(data));
}

// Update legality zones based on driving time
function updateLegalityZones(totalDrivingHours) {
    const legalZone = document.getElementById('timeline_legalZone');
    const warningZone = document.getElementById('timeline_warningZone');
    const dangerZone = document.getElementById('timeline_dangerZone');
    const legalRange = document.getElementById('timeline_legalRange');
    const warningRange = document.getElementById('timeline_warningRange');
    const dangerRange = document.getElementById('timeline_dangerRange');
    
    if (totalDrivingHours <= 8) {
        // Trip is in legal zone
        legalZone.style.borderWidth = '4px';
        legalZone.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
        warningZone.style.borderWidth = '3px';
        warningZone.style.boxShadow = 'none';
        dangerZone.style.borderWidth = '3px';
        dangerZone.style.boxShadow = 'none';
        legalRange.textContent = `0-8 hours (✅ You: ${formatHours(totalDrivingHours)})`;
    } else if (totalDrivingHours <= 10) {
        // Trip is in warning zone
        legalZone.style.borderWidth = '3px';
        legalZone.style.boxShadow = 'none';
        warningZone.style.borderWidth = '4px';
        warningZone.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
        dangerZone.style.borderWidth = '3px';
        dangerZone.style.boxShadow = 'none';
        warningRange.textContent = `8-10 hours (⚠️ You: ${formatHours(totalDrivingHours)})`;
    } else {
        // Trip exceeds limits
        legalZone.style.borderWidth = '3px';
        legalZone.style.boxShadow = 'none';
        warningZone.style.borderWidth = '3px';
        warningZone.style.boxShadow = 'none';
        dangerZone.style.borderWidth = '4px';
        dangerZone.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
        dangerRange.textContent = `>10 hours (❌ You: ${formatHours(totalDrivingHours)})`;
    }
}

// Google Maps API Configuration
// To enable automatic distance calculation, add your Google Maps API key here:
const GOOGLE_MAPS_API_KEY = ''; // Add your API key here

// Calculate trip distance automatically from addresses
async function calculateTripDistance() {
    const pickupLocation = document.getElementById('trip_pickupLocation')?.value.trim();
    const dropoffLocation = document.getElementById('trip_dropoffLocation')?.value.trim();
    const milesInput = document.getElementById('trip_miles');
    
    if (!pickupLocation || !dropoffLocation) {
        return; // Need both addresses
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
        // No API key configured - show helpful message
        const calculateBtn = document.querySelector('.add-trip-btn');
        if (calculateBtn && !document.getElementById('apiKeyWarning')) {
            const warning = document.createElement('div');
            warning.id = 'apiKeyWarning';
            warning.className = 'settings-info-box';
            warning.style.marginTop = '20px';
            warning.innerHTML = `
                <strong>🔑 Google Maps API Key Required:</strong><br>
                To enable automatic distance calculation from addresses, please add your Google Maps API key to script.js.<br>
                For now, you can manually enter the distance in miles.
            `;
            calculateBtn.parentElement.insertBefore(warning, calculateBtn);
        }
        return;
    }
    
    try {
        // Show loading state
        if (milesInput) {
            milesInput.value = 'Calculating...';
            milesInput.disabled = true;
        }
        
        // Call Google Maps Distance Matrix API
        const origin = encodeURIComponent(pickupLocation);
        const destination = encodeURIComponent(dropoffLocation);
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
            // Extract distance in miles
            const distanceText = data.rows[0].elements[0].distance.text;
            const distanceMiles = parseFloat(distanceText.replace(/,/g, ''));
            
            if (milesInput) {
                milesInput.value = distanceMiles.toFixed(1);
                milesInput.disabled = false;
            }
            
            // Show success message
            console.log(`✅ Distance calculated: ${distanceMiles.toFixed(1)} miles`);
        } else {
            throw new Error('Unable to calculate distance');
        }
    } catch (error) {
        console.error('Error calculating distance:', error);
        if (milesInput) {
            milesInput.value = '';
            milesInput.placeholder = 'Enter miles manually';
            milesInput.disabled = false;
        }
        // Don't alert - just allow manual entry
    }
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('dotHoursData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentStatus = data.currentStatus || 'off-duty';
            statusStartTime = data.statusStartTime;
            drivingHours = data.drivingHours || 0;
            onDutyHours = data.onDutyHours || 0;
            weeklyHours = data.weeklyHours || 0;
            timeSinceLastBreak = data.timeSinceLastBreak || 0;
            lastBreakTime = data.lastBreakTime;
            logEntries = data.logEntries || [];
            trips = data.trips || [];
            hosMode = data.hosMode || '70_8';
            
            // Resume update interval if status was active
            if (statusStartTime) {
                updateInterval = setInterval(updateDisplay, 1000);
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Section Reordering Functionality - Drag & Drop
let reorderMode = false;
let draggedElement = null;

function toggleReorderMode() {
    reorderMode = !reorderMode;
    const container = document.querySelector('.container');
    const btn = document.getElementById('toggleReorderBtn');
    
    if (reorderMode) {
        container.classList.add('reorder-mode');
        btn.classList.add('active');
        btn.innerHTML = '<span>✓ Done Reordering</span>';
        enableDragAndDrop();
    } else {
        container.classList.remove('reorder-mode');
        btn.classList.remove('active');
        btn.innerHTML = '<span>🔀 Drag to Reorder</span>';
        disableDragAndDrop();
        saveSectionOrder();
    }
}

function enableDragAndDrop() {
    const sections = document.querySelectorAll('.reorderable-section');
    
    sections.forEach(section => {
        section.setAttribute('draggable', 'true');
        
        section.addEventListener('dragstart', handleDragStart);
        section.addEventListener('dragover', handleDragOver);
        section.addEventListener('drop', handleDrop);
        section.addEventListener('dragend', handleDragEnd);
        section.addEventListener('dragenter', handleDragEnter);
        section.addEventListener('dragleave', handleDragLeave);
    });
}

function disableDragAndDrop() {
    const sections = document.querySelectorAll('.reorderable-section');
    
    sections.forEach(section => {
        section.removeAttribute('draggable');
        section.removeEventListener('dragstart', handleDragStart);
        section.removeEventListener('dragover', handleDragOver);
        section.removeEventListener('drop', handleDrop);
        section.removeEventListener('dragend', handleDragEnd);
        section.removeEventListener('dragenter', handleDragEnter);
        section.removeEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement && this.classList.contains('reorderable-section')) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this && this.classList.contains('reorderable-section')) {
        // Get the container
        const container = this.parentNode;
        
        // Determine where to insert the dragged element
        const allSections = Array.from(container.querySelectorAll('.reorderable-section'));
        const draggedIndex = allSections.indexOf(draggedElement);
        const targetIndex = allSections.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            // Moving down - insert after target
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            // Moving up - insert before target
            container.insertBefore(draggedElement, this);
        }
        
        // Animate the moved element
        animateMove(draggedElement);
    }
    
    this.classList.remove('drag-over');
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove drag-over class from all sections
    const sections = document.querySelectorAll('.reorderable-section');
    sections.forEach(section => {
        section.classList.remove('drag-over');
    });
    
    draggedElement = null;
}

function animateMove(element) {
    element.style.transform = 'scale(1.05)';
    element.style.background = '#F3E8FF';
    setTimeout(() => {
        element.style.transform = '';
        element.style.background = '';
    }, 300);
}

function saveSectionOrder() {
    const sections = document.querySelectorAll('.reorderable-section');
    const order = Array.from(sections).map(section => section.dataset.sectionId);
    localStorage.setItem('sectionOrder', JSON.stringify(order));
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = '✅ Section order saved!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

function loadSectionOrder() {
    const savedOrder = localStorage.getItem('sectionOrder');
    if (!savedOrder) return;
    
    try {
        const order = JSON.parse(savedOrder);
        const container = document.querySelector('.container');
        if (!container) return;
        
        // Get all reorderable sections
        const sections = document.querySelectorAll('.reorderable-section');
        const sectionMap = new Map();
        sections.forEach(section => {
            sectionMap.set(section.dataset.sectionId, section);
        });
        
        // Find the first non-reorderable element to insert after
        let insertAfter = null;
        for (let child of container.children) {
            if (!child.classList.contains('reorderable-section')) {
                insertAfter = child;
            } else {
                break;
            }
        }
        
        // Reorder sections according to saved order
        order.forEach(sectionId => {
            const section = sectionMap.get(sectionId);
            if (section) {
                if (insertAfter) {
                    container.insertBefore(section, insertAfter.nextSibling);
                    insertAfter = section;
                } else {
                    container.appendChild(section);
                    insertAfter = section;
                }
            }
        });
    } catch (e) {
        console.error('Error loading section order:', e);
    }
}

// Load saved section order on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSectionOrder();
    initNavigation();
    initSearch();
});

// Google Maps initialised via script callback — see onGoogleMapsLoaded() below

// Header tab click handler — shows one page, hides all others
function setActiveTab(el, pageId) {
    document.querySelectorAll('.header-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// NAVIGATION & TAB SWITCHING
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('[id]');
    
    // Sidebar nav → page ID map
    const sidebarPageMap = {
        'current-status': 'page-live',
        'hours-summary':  'page-hours',
        'pay-calculator': 'page-pay',
        'trips-management': 'page-trips',
        'vehicles-management': 'page-vehicles',
        'multi-trip':     'page-planner',
        'trip-calc':      'page-planner',
        'status-controls':'page-controls',
        'duty-log':       'page-duty-log',
        'settings':       'page-settings',
    };

    // Handle nav item clicks
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const pageId = sidebarPageMap[targetId] || ('page-' + targetId);

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            const page = document.getElementById(pageId);
            if (page) {
                page.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Sync header tab active state
            document.querySelectorAll('.header-tab').forEach(t => {
                t.classList.remove('active');
                if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(pageId)) {
                    t.classList.add('active');
                }
            });
        });
    });
    
    // Update active state on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function initSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchClear = document.getElementById('searchClear');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'block' : 'none';
        }
        
        if (query.length < 2) {
            clearSearchHighlights();
            return;
        }
        
        performSearch(query);
    });
    
    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            clearSearchHighlights();
            searchInput.focus();
        });
    }
}

function performSearch(query) {
    clearSearchHighlights();

    const sections = document.querySelectorAll('.reorderable-section, #current-status, #trip-calc');
    let firstMatch = null;

    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        if (text.includes(query)) {
            section.classList.add('search-highlight');
            section.style.opacity = '1';
            if (!firstMatch) firstMatch = section;
        } else {
            section.style.opacity = '0.3';
        }
    });

    if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function clearSearchHighlights() {
    const highlighted = document.querySelectorAll('.search-highlight');
    highlighted.forEach(el => {
        el.classList.remove('search-highlight');
        el.style.opacity = '1';
    });

    const sections = document.querySelectorAll('.reorderable-section, #current-status, #trip-calc');
    sections.forEach(section => {
        section.style.opacity = '1';
    });
}

// ============================================
// TRIP CALCULATOR PANEL
// ============================================

let tcStopCount = 0;

// ---- Google Places Autocomplete ----

function initAddressAutocomplete(input) {
    const ac = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address'],
        types: ['address']
    });
    ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place.formatted_address) input.value = place.formatted_address;
        calcTotalMiles();
    });
}

function initTripCalculatorAutocomplete() {
    ['tcPickupLoc', 'tcDropoffLoc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) initAddressAutocomplete(el);
    });
}

function calcTripTimes() {
    const pickup = document.getElementById('tcPickup')?.value;
    const dropoff = document.getElementById('tcDropoff')?.value;
    const retPickup = document.getElementById('tcReturnPickup')?.value;
    const retDropoff = document.getElementById('tcReturnDropoff')?.value;

    let totalMs = 0;
    let earliestMs = null;
    let latestMs = null;

    function addRange(start, end) {
        if (!start || !end) return;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        if (isNaN(s) || isNaN(e) || e <= s) return;
        totalMs += (e - s);
        if (earliestMs === null || s < earliestMs) earliestMs = s;
        if (latestMs === null || e > latestMs) latestMs = e;
    }

    addRange(pickup, dropoff);
    addRange(retPickup, retDropoff);

    const hoursEl = document.getElementById('tcTotalHours');
    const daysEl = document.getElementById('tcTripDays');

    if (totalMs > 0) {
        const totalHours = totalMs / 3600000;
        const h = Math.floor(totalHours);
        const m = Math.round((totalHours - h) * 60);
        hoursEl.textContent = `${h}h ${m}m`;
    } else {
        hoursEl.textContent = '—';
    }

    if (earliestMs !== null && latestMs !== null) {
        const days = Math.ceil((latestMs - earliestMs) / 86400000);
        daysEl.textContent = days === 1 ? '1 day' : `${days} days`;
    } else {
        daysEl.textContent = '—';
    }
}

function addTripStop() {
    tcStopCount++;
    const container = document.getElementById('tcStopsContainer');
    const div = document.createElement('div');
    div.className = 'panel-stop-row';
    div.id = `tcStop${tcStopCount}`;
    div.innerHTML = `
        <input type="text" class="panel-input tc-stop-loc" placeholder="Stop ${tcStopCount} address...">
        <button class="panel-stop-remove" onclick="removeTripStop('tcStop${tcStopCount}')" title="Remove">✕</button>
    `;
    container.appendChild(div);
    initAddressAutocomplete(div.querySelector('.tc-stop-loc'));
}

function removeTripStop(id) {
    const el = document.getElementById(id);
    if (el) { el.remove(); calcTotalMiles(); }
}

function calcTotalMiles() {
    const pickup = document.getElementById('tcPickupLoc')?.value.trim();
    const dropoff = document.getElementById('tcDropoffLoc')?.value.trim();
    const milesEl = document.getElementById('tcTotalMiles');
    const statusEl = document.getElementById('tcMilesStatus');

    if (!pickup || !dropoff) {
        milesEl.textContent = '—';
        statusEl.textContent = '';
        return;
    }

    const stopInputs = Array.from(document.querySelectorAll('.tc-stop-loc'))
        .map(i => i.value.trim()).filter(Boolean);

    const waypoints = stopInputs.map(addr => ({ location: addr, stopover: true }));

    statusEl.textContent = 'Calculating route...';

    const svc = new google.maps.DirectionsService();
    svc.route({
        origin: pickup,
        destination: dropoff,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL
    }, (result, status) => {
        if (status === 'OK') {
            let totalMeters = 0;
            result.routes[0].legs.forEach(leg => { totalMeters += leg.distance.value; });
            const miles = (totalMeters / 1609.344).toFixed(1);
            milesEl.textContent = `${miles} mi`;
            statusEl.textContent = waypoints.length ? `${waypoints.length} stop(s) included` : '';
        } else {
            milesEl.textContent = '—';
            statusEl.textContent = 'Route not found';
        }
    });
}

// ============================================
// GOOGLE MAPS INIT (callback from API script)
// ============================================

function onGoogleMapsLoaded() {
    console.log('Google Maps loaded');
    // Fleet map
    const mapEl = document.getElementById('dashboard-map');
    if (mapEl) {
        new google.maps.Map(mapEl, {
            center: { lat: 33.0, lng: -81.0 },
            zoom: 7,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });
    }
    // Address autocomplete on trip calculator fields
    initTripCalculatorAutocomplete();
}
