"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function TripsPage() {
  const [trips, setTrips] = useState<any>(null);

  useEffect(() => {
    api.get("/api/trips").then(res => setTrips(res.data)).catch(console.error);
  }, []);

  const tripList = trips?.trips ?? [];

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", marginBottom: 32 }}>Trips</h1>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f7fafc" }}>
              {["ID", "Name", "Start Time", "End Time", "Driver", "Vehicle"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#718096", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tripList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#a0aec0", fontSize: 14 }}>No trips found</td>
              </tr>
            ) : tripList.map((trip: any) => (
              <tr key={trip.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>#{trip.id}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#1a202c" }}>{trip.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{trip.startTime ? new Date(trip.startTime).toLocaleString() : "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{trip.endTime ? new Date(trip.endTime).toLocaleString() : "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{trip.driverId ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#4a5568" }}>{trip.vehicleId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
