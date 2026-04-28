import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ drivers: [] });
});

router.get("/:id", (req, res) => {
  res.json({ driver: { id: req.params.id, name: "Sample Driver" } });
});

export default router;
