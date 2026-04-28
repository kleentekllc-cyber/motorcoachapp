import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ trips: [] });
});

router.get("/:id", (req, res) => {
  res.json({ trip: { id: req.params.id, name: "Sample Trip" } });
});

export default router;
