export const DepotLoadAI = {
  calculate(depotId?: number) {
    return {
      depotId: depotId || 3,
      loadScore: 0.82,
      capacityUsed: 91,
      vehiclesAvailable: 2,
      driversAvailable: 1,
      overloaded: true,
      recommendedActions: [
        "Relocate 2 vehicles from Depot 1",
        "Reassign 1 driver from Depot 2",
        "Shift 3 trips to Depot 4"
      ],
      timestamp: new Date().toISOString()
    };
  },

  getAllDepots() {
    return {
      overloadedDepots: ["Charleston"],
      underutilizedDepots: ["Greenville"],
      recommendedRelocations: 3,
      deadheadReduction: "14.2%",
      timestamp: new Date().toISOString()
    };
  }
};
