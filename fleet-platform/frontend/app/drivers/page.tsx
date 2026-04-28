"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any>(null);

  useEffect(() => {
    api.get("/api/drivers").then(res => setDrivers(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>👤 Drivers</h1>
      <pre>{JSON.stringify(drivers, null, 2)}</pre>
    </main>
  );
}
