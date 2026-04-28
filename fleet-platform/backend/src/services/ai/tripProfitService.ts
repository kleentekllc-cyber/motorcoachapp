export const TripProfitAI = {
  calculate(tripId?: number) {
    const revenue = 1200;
    const cost = 740;
    const margin = revenue - cost;
    const marginPercent = (margin / revenue) * 100;

    return {
      tripId: tripId || 441,
      revenue,
      cost,
      margin,
      marginPercent: parseFloat(marginPercent.toFixed(2)),
      efficiencyScore: 0.78,
      riskScore: 0.32,
      timestamp: new Date().toISOString()
    };
  }
};
