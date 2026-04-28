"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get("/api/health").then(res => setHealth(res.data)).catch(console.error);
    api.get("/api/analytics").then(res => setAnalytics(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>📊 Dashboard</h1>
      
      <div style={{ marginTop: 24 }}>
        <h2>Health Check</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Analytics</h2>
        <pre>{JSON.stringify(analytics, null, 2)}</pre>
      </div>
    </main>
  );
}
