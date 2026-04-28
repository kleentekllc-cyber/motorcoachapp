"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any>(null);

  useEffect(() => {
    api.get("/api/vehicles").then(res => setVehicles(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>🚗 Vehicles</h1>
      <pre>{JSON.stringify(vehicles, null, 2)}</pre>
    </main>
  );
}
