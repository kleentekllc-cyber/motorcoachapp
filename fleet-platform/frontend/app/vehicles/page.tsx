"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any>(null);

  useEffect(() => {
    api.get("/api/vehicles").then(res => setVehicles(res.data)).catch(console.error);
  }, []);

  const vehicleList = vehicles?.vehicles ?? [];

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 32 }}>Vehicles</h1>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              {["ID", "Name", "Plate", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#718096", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicleList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#a0aec0", fontSize: 14 }}>No vehicles found</td>
              </tr>
            ) : vehicleList.map((vehicle: any) => (
              <tr key={vehicle.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>#{vehicle.id}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#1a202c" }}>{vehicle.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{vehicle.plate}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: vehicle.active ? "#f0fff4" : "#fff5f5", color: vehicle.active ? "#38a169" : "#e53e3e" }}>
                    {vehicle.active ? "Active" : "Inactive"}
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
