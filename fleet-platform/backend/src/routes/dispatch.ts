import { Router } from "express";
import { AutonomousDispatchAI } from "../services/ai/autonomousDispatchService";

const router = Router();

router.post("/autonomous", (req, res) => {
  const tripId = req.body.tripId;
  res.json(AutonomousDispatchAI.run(tripId));
});

router.get("/autonomous/logs", (_req, res) => {
  res.json({
    logs: [
      { id: 1, tripId: 441, timestamp: new Date().toISOString(), status: "success" },
      { id: 2, tripId: 442, timestamp: new Date().toISOString(), status: "success" }
    ]
  });
});

router.get("/autonomous/trip/:id", (req, res) => {
  res.json(AutonomousDispatchAI.run(parseInt(req.params.id)));
});

export default router;
