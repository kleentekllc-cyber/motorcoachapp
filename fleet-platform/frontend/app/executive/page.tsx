"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: "#718096", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#1a202c" }}>{value}</div>
    </div>
  );
}

export default function ExecutivePage() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    api.get("/api/executive/overview").then(res => setOverview(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 8 }}>Executive Command Center</h1>
      <p style={{ color: "#718096", marginBottom: 32 }}>High-level fleet performance overview</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Fleet Health" value={overview ? `${overview.fleet_health}%` : "—"} color="#2d5be3" />
        <StatCard label="Fleet Profit" value={overview ? `${overview.fleet_profit}%` : "—"} color="#38a169" />
        <StatCard label="Fleet Risk" value={overview ? `${overview.fleet_risk}%` : "—"} color="#d69e2e" />
      </div>

      {overview?.alerts?.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a202c", marginBottom: 16 }}>Alerts</h2>
          {overview.alerts.map((alert: any, i: number) => (
            <div key={i} style={{ padding: "10px 14px", background: "#fff5f5", borderRadius: 8, marginBottom: 8, fontSize: 14, color: "#742a2a" }}>{alert}</div>
          ))}
        </div>
      )}

      {overview && overview?.alerts?.length === 0 && (
        <div style={{ background: "#f0fff4", borderRadius: 12, padding: 20, fontSize: 14, color: "#276749", fontWeight: 500 }}>
          No active alerts — all systems operating normally.
        </div>
      )}
    </main>
  );
}
