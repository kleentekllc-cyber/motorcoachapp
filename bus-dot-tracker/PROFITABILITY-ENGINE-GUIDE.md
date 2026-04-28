# Trip Profitability Engine Guide

## Overview

The **Trip Profitability Engine** is a comprehensive system for tracking, calculating, and analyzing profit margins across trips, customers, routes, and your entire fleet. It implements THREE core formulas:

### 1. Profit Margin Formula
```
Margin = (Revenue - Cost) / Revenue
```

### 2. Efficiency Score Formula
```
Efficiency = (MPG_Score + Deadhead_Score + Driver_Cost_Score) / 3
```

Where each component score ranges from 0-100:
- **MPG_Score**: Fuel efficiency rating
- **Deadhead_Score**: Efficiency of deadhead miles (lower is better)
- **Driver_Cost_Score**: Driver cost efficiency relative to revenue

### 3. Risk Score Formula
```
Risk = (Weather_Risk + Traffic_Risk + Breakdown_Risk) / 3
```

Where each risk component ranges from 0-100:
- **Weather_Risk**: Weather-related risk assessment (severe weather, road conditions)
- **Traffic_Risk**: Traffic congestion and delay risk
- **Breakdown_Risk**: Vehicle breakdown probability based on age/maintenance

## Features

### 1. **Trip-Level Profitability**
- `trip_revenue`: Total revenue for the trip
- `trip_cost`: Total operating cost
- `trip_profit`: Net profit (Revenue - Cost)
- `trip_margin`: Profit margin percentage
- `mpg_score`: Fuel efficiency score (0-100)
- `deadhead_score`: Deadhead miles efficiency (0-100)
- `driver_cost_score`: Driver cost efficiency (0-100)
- `efficiency_score`: Overall efficiency metric

### 2. **Customer Profitability Analysis**
- Total revenue and cost per customer
- Average margin by customer
- Customer lifetime value (LTV)
- Trip count per customer
- Customer tier and risk assessment (future)

### 3. **Route Profitability Analysis**
- Total revenue and cost per route
- Average margin by route
- Route efficiency metrics
- Route optimization recommendations (future)

### 4. **Fleet Dashboard**
- Fleet-wide margin KPI
- Total revenue, cost, and profit
- Per-trip averages
- Trend analysis over time

## API Endpoints

### Trip Profitability

#### Get Trip Profit
```
GET /api/profitability/trips/:id/profit
```
Returns detailed profit information for a specific trip.

**Response:**
```json
{
  "tripId": 1,
  "tripRevenue": 1500.00,
  "tripCost": 900.00,
  "tripProfit": 600.00,
  "tripMargin": 0.4000,
  "customerName": "ABC School District",
  "routeName": "Route 101"
}
```

#### Get Trip Margin
```
GET /api/profitability/trips/:id/margin
```
Returns just the margin for a specific trip.

**Response:**
```json
{
  "tripId": 1,
  "margin": 0.4000
}
```

#### Calculate Trip Profitability
```
POST /api/profitability/trips/:id/calculate
```
Calculates and updates the profit/margin for a trip based on current revenue and cost.

### Customer Profitability

#### Get All Customers
```
GET /api/profitability/customers?startDate=2026-01-01&endDate=2026-12-31
```
Returns profitability metrics for all customers.

**Response:**
```json
[
  {
    "customerName": "ABC School District",
    "totalRevenue": 45000.00,
    "totalCost": 27000.00,
    "totalProfit": 18000.00,
    "averageMargin": 0.4000,
    "tripCount": 30,
    "lifetimeValue": 18000.00
  }
]
```

#### Get Single Customer
```
GET /api/profitability/customers/:name?startDate=2026-01-01&endDate=2026-12-31
```
Returns profitability metrics for a specific customer.

### Route Profitability

#### Get All Routes
```
GET /api/profitability/routes?startDate=2026-01-01&endDate=2026-12-31
```
Returns profitability metrics for all routes.

**Response:**
```json
[
  {
    "routeName": "Route 101",
    "totalRevenue": 30000.00,
    "totalCost": 18000.00,
    "totalProfit": 12000.00,
    "averageMargin": 0.4000,
    "tripCount": 20,
    "efficiency": 1.67
  }
]
```

#### Get Single Route
```
GET /api/profitability/routes/:name?startDate=2026-01-01&endDate=2026-12-31
```
Returns profitability metrics for a specific route.

### Fleet Dashboard

#### Get Fleet Profitability
```
GET /api/profitability/fleet?startDate=2026-01-01&endDate=2026-12-31
```
Returns fleet-wide profitability KPIs.

**Response:**
```json
{
  "totalRevenue": 250000.00,
  "totalCost": 155000.00,
  "totalProfit": 95000.00,
  "fleetMargin": 0.3800,
  "tripCount": 150,
  "avgRevenuePerTrip": 1666.67,
  "avgCostPerTrip": 1033.33,
  "avgProfitPerTrip": 633.33
}
```

### Bulk Operations

#### Bulk Calculate
```
POST /api/profitability/bulk-calculate?startDate=2026-01-01&endDate=2026-12-31
```
Recalculates profitability for all trips in the specified date range.

**Response:**
```json
{
  "updated": 150
}
```

## Database Schema

### New Fields in `trips` Table

```sql
trip_revenue       DECIMAL(10,2)   DEFAULT 0   -- Total revenue
trip_cost          DECIMAL(10,2)   DEFAULT 0   -- Total cost
trip_profit        DECIMAL(10,2)   DEFAULT 0   -- Calculated profit
trip_margin        DECIMAL(5,4)    DEFAULT 0   -- Calculated margin
customer_name      VARCHAR(255)                -- Customer grouping
route_name         VARCHAR(255)                -- Route grouping
mpg_score          DECIMAL(5,2)    DEFAULT 0   -- Fuel efficiency score
deadhead_score     DECIMAL(5,2)    DEFAULT 0   -- Deadhead efficiency
driver_cost_score  DECIMAL(5,2)    DEFAULT 0   -- Driver cost efficiency
efficiency_score   DECIMAL(5,2)    DEFAULT 0   -- Overall efficiency
```

## Efficiency Scoring

### Component Scores (0-100 scale)

#### 1. MPG Score
Measures fuel efficiency relative to vehicle type baseline:
```javascript
const baselineMPG = 6.0; // Average mpg for bus type
const actualMPG = totalMiles / gallonsUsed;
const mpgScore = Math.min(100, (actualMPG / baselineMPG) * 100);
```

#### 2. Deadhead Score
Measures efficiency of empty/deadhead miles (inverse - lower deadhead is better):
```javascript
const deadheadRatio = deadheadMiles / totalMiles;
const deadheadScore = Math.max(0, 100 - (deadheadRatio * 100));
```

#### 3. Driver Cost Score
Measures driver cost efficiency relative to revenue:
```javascript
const driverCostRatio = driverPay / tripRevenue;
const targetRatio = 0.35; // Target 35% or less
const driverCostScore = Math.max(0, 100 - ((driverCostRatio / targetRatio) * 100));
```

### Overall Efficiency Score
```javascript
efficiency_score = (mpg_score + deadhead_score + driver_cost_score) / 3
```

## Frontend Integration

### Service Usage

```javascript
import ProfitabilityService from './services/ProfitabilityService.js';

const profitService = new ProfitabilityService();

// Get fleet profitability
const fleetData = await profitService.getFleetProfitability('2026-01-01', '2026-12-31');

// Get customer profitability
const customers = await profitService.getAllCustomersProfitability();

// Calculate trip profitability
await profitService.calculateTripProfitability(tripId);
```

### Controller Usage

```javascript
import ProfitabilityController from './controllers/ProfitabilityController.js';

const profitController = new ProfitabilityController();
await profitController.init();
```

## Margin Thresholds

The system uses color-coded margin thresholds:

| Margin Range | Classification | Color Class |
|--------------|----------------|-------------|
| ≥ 30%        | Excellent      | `profit-excellent` (Dark Green) |
| 15% - 29%    | Good           | `profit-good` (Green) |
| 5% - 14%     | Fair           | `profit-fair` (Yellow) |
| 0% - 4%      | Poor           | `profit-poor` (Orange) |
| < 0%         | Loss           | `profit-loss` (Red) |

## Workflow

### 1. **Setup Trip Revenue & Cost**

When creating or updating a trip, set:
```json
{
  "trip_revenue": 1500.00,
  "trip_cost": 900.00,
  "customer_name": "ABC School District",
  "route_name": "Route 101"
}
```

### 2. **Calculate Profitability**

```bash
POST /api/profitability/trips/1/calculate
```
This automatically calculates:
- `trip_profit = trip_revenue - trip_cost`
- `trip_margin = trip_profit / trip_revenue`

### 3. **View Reports**

```bash
# Fleet Dashboard
GET /api/profitability/fleet

# Customer Analysis
GET /api/profitability/customers

# Route Analysis
GET /api/profitability/routes
```

## Migration

To add profitability fields to an existing database:

```bash
cd backend
psql -U your_user -d your_database -f prisma/migrations/add_profitability_fields.sql
```

Or update Prisma and migrate:

```bash
cd backend
npx prisma migrate dev --name add_profitability_fields
```

## Cost Calculation

Trip costs can include:
- Driver wages (calculated from pay system)
- Fuel costs (estimated from mileage)
- Vehicle maintenance allocation
- Insurance and overhead allocation
- Deadhead miles cost

### Example Cost Calculation

```javascript
const driverPay = calculateDriverPay(trip);
const fuelCost = (trip.estimated_mileage + trip.deadhead_miles) * fuelCostPerMile;
const maintenanceCost = trip.estimated_mileage * maintenanceCostPerMile;
const overheadCost = calculateOverhead(trip);

const tripCost = driverPay + fuelCost + maintenanceCost + overheadCost;
```

## Future Enhancements (Phase 47 & 48)

### Customer Profit Engine
- Customer lifetime value projection
- Customer tier classification (Premium, Standard, Budget)
- Customer risk assessment
- Dynamic pricing recommendations per customer

### Route Profit Engine
- Route efficiency optimization
- Route pricing recommendations
- Route consolidation opportunities
- Seasonal route profitability analysis

### Advanced Analytics
- Depot-level margin analysis
- Vehicle-level profitability
- Driver efficiency impact on margins
- Predictive margin forecasting

## Best Practices

1. **Always set revenue and cost** when creating trips
2. **Recalculate regularly** using bulk-calculate endpoint
3. **Monitor margin trends** weekly or monthly
4. **Use customer and route grouping** for better insights
5. **Set pricing based on margin targets** (aim for 20-30%)
6. **Review low-margin trips** and investigate causes

## Troubleshooting

### Margin showing as 0%
- Ensure `trip_revenue` is set and > 0
- Run calculate endpoint to update
- Check that cost and revenue are correctly entered

### Missing customer/route data
- Populate `customer_name` and `route_name` fields
- Run bulk-calculate to refresh groupings

### Incorrect calculations
- Verify revenue and cost values
- Check for negative values
- Ensure decimals are properly formatted

## Support

For questions or issues:
- Review this guide
- Check API documentation
- Examine console logs for errors
- Verify database schema matches expected structure
