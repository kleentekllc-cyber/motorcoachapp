"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any>(null);

  useEffect(() => {
    api.get("/api/drivers").then(res => setDrivers(res.data)).catch(console.error);
  }, []);

  const driverList = drivers?.drivers ?? [];

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 32 }}>Drivers</h1>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              {["ID", "Name", "Email", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#718096", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {driverList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#a0aec0", fontSize: 14 }}>No drivers found</td>
              </tr>
            ) : driverList.map((driver: any) => (
              <tr key={driver.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>#{driver.id}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#1a202c" }}>{driver.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{driver.email ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: driver.active ? "#f0fff4" : "#fff5f5", color: driver.active ? "#38a169" : "#e53e3e" }}>
                    {driver.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
