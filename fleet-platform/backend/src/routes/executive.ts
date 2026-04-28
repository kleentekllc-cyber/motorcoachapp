import { Router } from "express";

const router = Router();

router.get("/overview", (_req, res) => {
  res.json({
    fleet_health: 87,
    fleet_profit: 82,
    fleet_risk: 74,
    alerts: []
  });
});

router.get("/alerts", (_req, res) => {
  res.json({ alerts: [] });
});

router.get("/recommendations", (_req, res) => {
  res.json({ recommendations: [] });
});

export default router;
