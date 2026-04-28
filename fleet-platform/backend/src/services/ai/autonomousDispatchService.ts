export const AutonomousDispatchAI = {
  run(tripId?: number) {
    return {
      tripId: tripId || 441,
      driverId: 22,
      vehicleId: 14,
      depotId: 3,
      legalityStatus: "legal",
      actionsTaken: [
        "Reassigned driver due to HOS risk",
        "Selected vehicle with lowest maintenance risk",
        "Adjusted pickup time by 15 minutes",
        "Reduced deadhead by 12%"
      ],
      metrics: {
        autoAssignedTrips: 14,
        illegalTripsPrevented: 6,
        deadheadReduction: "18%",
        profitIncrease: "$2,140",
        safetyImprovements: 3
      },
      timestamp: new Date().toISOString()
    };
  }
};
