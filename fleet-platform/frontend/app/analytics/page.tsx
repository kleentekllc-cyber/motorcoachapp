"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AnalyticsPage() {
  const [fleetHealth, setFleetHealth] = useState<any>(null);
  const [depotLoad, setDepotLoad] = useState<any>(null);
  const [tripProfit, setTripProfit] = useState<any>(null);

  useEffect(() => {
    api.get("/api/analytics/fleet-health").then(res => setFleetHealth(res.data)).catch(console.error);
    api.get("/api/analytics/depot-load").then(res => setDepotLoad(res.data)).catch(console.error);
    api.get("/api/analytics/trip-profit").then(res => setTripProfit(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>📊 AI Analytics</h1>
      
      <div style={{ marginTop: 24 }}>
        <h2>Fleet Health</h2>
        <pre>{JSON.stringify(fleetHealth, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Depot Load</h2>
        <pre>{JSON.stringify(depotLoad, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Trip Profit</h2>
        <pre>{JSON.stringify(tripProfit, null, 2)}</pre>
      </div>
    </main>
  );
}
