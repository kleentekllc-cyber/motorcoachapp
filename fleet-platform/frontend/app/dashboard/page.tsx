"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: "#718096", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#1a202c" }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get("/api/health").then(res => setHealth(res.data)).catch(console.error);
    api.get("/api/analytics").then(res => setAnalytics(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: "#718096", marginBottom: 32 }}>
        System status: {health ? <span style={{ color: "#38a169", fontWeight: 600 }}>● Online</span> : <span style={{ color: "#a0aec0" }}>Loading...</span>}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Profit Margin" value={analytics ? `${(analytics.profit_margin * 100).toFixed(0)}%` : "—"} color="#2d5be3" />
        <StatCard label="Efficiency Score" value={analytics ? `${(analytics.efficiency_score * 100).toFixed(0)}%` : "—"} color="#38a169" />
        <StatCard label="Risk Score" value={analytics ? `${(analytics.risk_score * 100).toFixed(0)}%` : "—"} color="#e53e3e" />
        <StatCard label="Fleet Health" value={analytics ? `${analytics.fleet_health}%` : "—"} color="#d69e2e" />
      </div>
    </main>
  );
}
