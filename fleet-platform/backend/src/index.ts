import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { registerRoutes } from "./routes";

const app = express();

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());

registerRoutes(app);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: env.nodeEnv });
});

app.listen(env.port, () => {
  console.log(`🚀 Backend running on port ${env.port}`);
});
