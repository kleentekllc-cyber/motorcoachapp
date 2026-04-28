import { Router } from "express";
import { FleetHealthAI } from "../services/ai/fleetHealthService";
import { DepotLoadAI } from "../services/ai/depotLoadService";
import { TripProfitAI } from "../services/ai/tripProfitService";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    profit_margin: 0.25,
    efficiency_score: 0.78,
    risk_score: 0.32,
    fleet_health: 87
  });
});

router.get("/fleet-health", (_req, res) => {
  res.json(FleetHealthAI.calculate());
});

router.get("/depot-load", (req, res) => {
  const depotId = req.query.depotId ? parseInt(req.query.depotId as string) : undefined;
  res.json(DepotLoadAI.calculate(depotId));
});

router.get("/depot-load/fleet", (_req, res) => {
  res.json(DepotLoadAI.getAllDepots());
});

router.get("/trip-profit", (req, res) => {
  const tripId = req.query.tripId ? parseInt(req.query.tripId as string) : undefined;
  res.json(TripProfitAI.calculate(tripId));
});

export default router;
