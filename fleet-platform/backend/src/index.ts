import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { registerRoutes } from "./routes";

const app = express();

const allowedOrigins = env.frontendOrigin.split(",").map(o => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

registerRoutes(app);

app.listen(env.port, () => {
  console.log(`🚀 Backend running on port ${env.port}`);
});
