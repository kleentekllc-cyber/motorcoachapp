# Frontend Integration Guide

## Overview

This guide explains how to connect the Bus DOT Hours Tracker frontend to the NestJS backend API.

---

## Architecture

```
HTML/JS Frontend → API Client (js/api.js) → NestJS API → Prisma → PostgreSQL
```

---

## Setup

### 1. Include API Client

Add to your `index.html` **before** `script.js`:

```html
<script src="js/api.js"></script>
<script src="script.js"></script>
```

### 2. Start Backend

```bash
cd backend
npm run start:dev
```

Backend will run on `http://localhost:3000`

---

## API Client Usage

The API client (`js/api.js`) exposes a global `API` object with organized endpoints:

### Drivers

```javascript
// Get all drivers
const drivers = await API.drivers.getAll();

// Get one driver
const driver = await API.drivers.getOne(1);

// Create driver
const newDriver = await API.drivers.create({
  name: "John Doe",
  email: "john@example.com",
  status: "off_duty",
  employment_type: "full_time"
});

// Update driver
await API.drivers.update(1, { status: "driving" });
```

### Vehicles

```javascript
// Get all vehicles
const vehicles = await API.vehicles.getAll();

// Create vehicle
const newVehicle = await API.vehicles.create({
  name: "Bus #001",
  type: "motorcoach",
  capacity: 55
});
```

### Trips

```javascript
// Get all trips
const trips = await API.trips.getAll();

// Create trip
const newTrip = await API.trips.create({
  passenger_name: "ABC Company",
  group_size: 48,
  pickup_location: "New York, NY",
  dropoff_location: "Boston, MA",
  pickup_time: "2026-04-05T08:00:00Z",
  estimated_mileage: 215,
  average_speed: 55,
  pre_trip_minutes: 15,
  post_trip_minutes: 15,
  dump_fuel_clean_minutes: 30,
  deadhead_miles: 0,
  relay_required: false,
  hotel_reset_required: false,
  status: "scheduled",
  driver_id: 1,
  vehicle_id: 1
});
```

### HOS Calculator

```javascript
// Calculate DOT Hours of Service
const hosResult = await API.hos.calculate(driverId, tripId);

// Response:
// {
//   legality_status: "legal" | "warning" | "illegal",
//   hours_remaining_today: 180,
//   hours_remaining_cycle: 1200,
//   violations: [],
//   recommendations: [],
//   timeline: [...],
//   totals: { driving_minutes: 240, on_duty_minutes: 270 }
// }
```

### Timeline Generator

```javascript
// Generate timeline
const timeline = await API.timeline.generate(tripId);

// Response: Array of segments
// [
//   {
//     type: "pre_trip",
//     start_time: "2026-04-05T08:00:00Z",
//     end_time: "2026-04-05T08:15:00Z",
//     duration_minutes: 15,
//     dot_status: "legal"
//   },
//   ...
// ]
```

### Pay Calculator

```javascript
// Calculate driver pay
const payResult = await API.pay.calculate(
  driverId,
  tripId,
  1800, // revenue
  "retail" // trip type
);

// Response:
// {
//   base_pay: 900,
//   gratuity: 180,
//   safety_bonus: 90,
//   deadhead_bonus: 0,
//   relay_bonus: 0,
//   total: 1170,
//   explanation: [...]
// }
```

### DOT Settings

```javascript
// Get settings
const settings = await API.settings.getDOT();

// Update settings
await API.settings.updateDOT({
  company_name: "Your Company",
  hos_11_hour_limit_minutes: 660,
  hos_14_hour_limit_minutes: 840,
  hos_60_70_hour_limit_minutes: 4200
});
```

---

## Integration Steps

### 1. Update Trips Page

**Replace mock data with API calls:**

```javascript
async function loadTrips() {
  try {
    const trips = await API.trips.getAll();
    displayTrips(trips);
  } catch (error) {
    console.error('Failed to load trips:', error);
    alert('Failed to load trips. Make sure the backend is running.');
  }
}

async function createTrip(formData) {
  try {
    const newTrip = await API.trips.create(formData);
    alert('Trip created successfully!');
    loadTrips(); // Reload list
  } catch (error) {
    console.error('Failed to create trip:', error);
    alert('Failed to create trip.');
  }
}
```

### 2. Update Drivers Page

```javascript
async function loadDrivers() {
  const drivers = await API.drivers.getAll();
  displayDrivers(drivers);
}

async function createDriver(formData) {
  const newDriver = await API.drivers.create(formData);
  loadDrivers();
}
```

### 3. Update Vehicles Page

```javascript
async function loadVehicles() {
  const vehicles = await API.vehicles.getAll();
  displayVehicles(vehicles);
}
```

### 4. Update DOT Calculator

```javascript
async function runHOSCheck() {
  const driverId = document.getElementById('driverSelect').value;
  const tripId = document.getElementById('tripSelect').value;
  
  try {
    const result = await API.hos.calculate(driverId, tripId);
    displayHOSResults(result);
  } catch (error) {
    console.error('HOS calculation failed:', error);
    alert('Failed to calculate HOS');
  }
}

function displayHOSResults(result) {
  document.getElementById('legality-status').textContent = result.legality_status;
  document.getElementById('hours-remaining').textContent = 
    `${Math.floor(result.hours_remaining_today / 60)}h ${result.hours_remaining_today % 60}m`;
  
  // Display violations
  const violationsList = document.getElementById('violations-list');
  violationsList.innerHTML = result.violations
    .map(v => `<li class="violation">${v}</li>`)
    .join('');
  
  // Display recommendations
  const recommendationsList = document.getElementById('recommendations-list');
  recommendationsList.innerHTML = result.recommendations
    .map(r => `<li class="recommendation">${r}</li>`)
    .join('');
}
```

### 5. Update Timeline View

```javascript
async function generateTimeline() {
  const tripId = document.getElementById('tripSelect').value;
  
  try {
    const timeline = await API.timeline.generate(tripId);
    displayTimeline(timeline);
  } catch (error) {
    console.error('Timeline generation failed:', error);
    alert('Failed to generate timeline');
  }
}

function displayTimeline(segments) {
  const timelineContainer = document.getElementById('timeline-container');
  timelineContainer.innerHTML = segments
    .map(seg => `
      <div class="timeline-segment ${seg.dot_status}">
        <strong>${seg.type}</strong>
        <span>${seg.duration_minutes} min</span>
        <span>${new Date(seg.start_time).toLocaleTimeString()}</span>
      </div>
    `)
    .join('');
}
```

### 6. Update Pay Calculator

```javascript
async function calculatePay() {
  const driverId = document.getElementById('driverSelect').value;
  const tripId = document.getElementById('tripSelect').value;
  const revenue = parseFloat(document.getElementById('revenue').value);
  const tripType = document.getElementById('tripType').value;
  
  try {
    const result = await API.pay.calculate(driverId, tripId, revenue, tripType);
    displayPayResults(result);
  } catch (error) {
    console.error('Pay calculation failed:', error);
    alert('Failed to calculate pay');
  }
}

function displayPayResults(result) {
  document.getElementById('base-pay').textContent = `$${result.base_pay.toFixed(2)}`;
  document.getElementById('gratuity').textContent = `$${result.gratuity.toFixed(2)}`;
  document.getElementById('safety-bonus').textContent = `$${result.safety_bonus.toFixed(2)}`;
  document.getElementById('deadhead-bonus').textContent = `$${result.deadhead_bonus.toFixed(2)}`;
  document.getElementById('relay-bonus').textContent = `$${result.relay_bonus.toFixed(2)}`;
  document.getElementById('total-pay').textContent = `$${result.total.toFixed(2)}`;
  
  // Display explanation
  const explanationList = document.getElementById('explanation-list');
  explanationList.innerHTML = result.explanation
    .map(exp => `<li>${exp}</li>`)
    .join('');
}
```

---

## Error Handling

All API methods include built-in error handling. Wrap calls in try-catch:

```javascript
try {
  const result = await API.trips.getAll();
  // Success
} catch (error) {
  console.error('API Error:', error);
  alert('Operation failed. Check console for details.');
}
```

---

## CORS Configuration

The backend is configured with CORS enabled for `http://localhost:3000` and `file://` protocol.

If you serve the frontend from a different origin, update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'your-origin-here'],
  credentials: true,
});
```

---

## Testing

1. **Start Backend**: `cd backend && npm run start:dev`
2. **Open Frontend**: Double-click `index.html`
3. **Open Console**: F12 to see API calls
4. **Test Integration**: Try creating a driver, vehicle, or trip

---

## Next Steps

1. ✅ Include `js/api.js` in `index.html`
2. ✅ Replace mock data with API calls
3. ✅ Test each page
4. ✅ Add loading indicators
5. ✅ Improve error messages
6. ✅ Add form validation
7. ✅ Deploy to production

---

## Troubleshooting

**Backend not responding?**
- Check backend is running: `npm run start:dev`
- Check console for CORS errors
- Verify API_BASE URL in `js/api.js`

**Database errors?**
- Run migrations: `npm run prisma:migrate`
- Run seed: `npm run prisma:seed`

**Authentication needed?**
- Future: Add JWT tokens
- Future: Add auth headers to API client
