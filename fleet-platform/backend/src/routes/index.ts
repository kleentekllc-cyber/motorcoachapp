import { Express } from "express";
import healthRouter from "./health";
import tripsRouter from "./trips";
import driversRouter from "./drivers";
import vehiclesRouter from "./vehicles";
import analyticsRouter from "./analytics";
import executiveRouter from "./executive";
import dispatchRouter from "./dispatch";

export function registerRoutes(app: Express) {
  app.use("/api/health", healthRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/drivers", driversRouter);
  app.use("/api/vehicles", vehiclesRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/executive", executiveRouter);
  app.use("/api/dispatch", dispatchRouter);
}
