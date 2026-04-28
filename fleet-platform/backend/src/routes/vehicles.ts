import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ vehicles: [] });
});

router.get("/:id", (req, res) => {
  res.json({ vehicle: { id: req.params.id, name: "Sample Vehicle" } });
});

export default router;
