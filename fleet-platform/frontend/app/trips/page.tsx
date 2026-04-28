"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function TripsPage() {
  const [trips, setTrips] = useState<any>(null);

  useEffect(() => {
    api.get("/api/trips").then(res => setTrips(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>🚌 Trips</h1>
      <pre>{JSON.stringify(trips, null, 2)}</pre>
    </main>
  );
}
