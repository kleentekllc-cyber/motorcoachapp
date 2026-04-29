"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a202c", marginBottom: 20 }}>{title}</h2>
      {children}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#4a5568" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a202c" }}>{pct}%</span>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 99, height: 7 }}>
        <div style={{ width: `${pct}%`, background: pct >= 85 ? "#38a169" : pct >= 70 ? "#d69e2e" : "#e53e3e", borderRadius: 99, height: 7 }} />
      </div>
    </div>
  );
}

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
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 32 }}>AI Analytics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

        <Card title="Fleet Health">
          {fleetHealth ? (
            <>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#2d5be3", marginBottom: 20 }}>{fleetHealth.overall}%</div>
              <ScoreBar label="Safety" value={fleetHealth.safety / 100} />
              <ScoreBar label="Maintenance" value={fleetHealth.maintenance / 100} />
              <ScoreBar label="Compliance" value={fleetHealth.compliance / 100} />
              <ScoreBar label="Profitability" value={fleetHealth.profitability / 100} />
              <ScoreBar label="Efficiency" value={fleetHealth.efficiency / 100} />
            </>
          ) : <p style={{ color: "#a0aec0" }}>Loading...</p>}
        </Card>

        <Card title="Depot Load">
          {depotLoad ? (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, textAlign: "center", background: depotLoad.overloaded ? "#fff5f5" : "#f0fff4", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: depotLoad.overloaded ? "#e53e3e" : "#38a169" }}>{depotLoad.capacityUsed}%</div>
                  <div style={{ fontSize: 12, color: "#718096" }}>Capacity Used</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#f7fafc", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#2d5be3" }}>{depotLoad.vehiclesAvailable}</div>
                  <div style={{ fontSize: 12, color: "#718096" }}>Vehicles Available</div>
                </div>
              </div>
              {depotLoad.overloaded && (
                <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#c53030", marginBottom: 8 }}>Depot Overloaded — Recommended Actions</div>
                  {depotLoad.recommendedActions.map((action: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, color: "#742a2a", marginBottom: 4 }}>• {action}</div>
                  ))}
                </div>
              )}
            </>
          ) : <p style={{ color: "#a0aec0" }}>Loading...</p>}
        </Card>

        <Card title={`Trip Profit — Trip #${tripProfit?.tripId ?? ""}`}>
          {tripProfit ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Revenue", value: `$${tripProfit.revenue.toLocaleString()}`, color: "#38a169" },
                  { label: "Cost", value: `$${tripProfit.cost.toLocaleString()}`, color: "#e53e3e" },
                  { label: "Margin", value: `$${tripProfit.margin.toLocaleString()}`, color: "#2d5be3" },
                  { label: "Margin %", value: `${tripProfit.marginPercent}%`, color: "#d69e2e" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#f7fafc", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "#718096", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
              <ScoreBar label="Efficiency Score" value={tripProfit.efficiencyScore} />
            </>
          ) : <p style={{ color: "#a0aec0" }}>Loading...</p>}
        </Card>

      </div>
    </main>
  );
}
