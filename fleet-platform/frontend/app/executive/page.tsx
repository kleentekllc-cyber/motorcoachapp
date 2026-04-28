"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ExecutivePage() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    api.get("/api/executive/overview").then(res => setOverview(res.data)).catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>📈 Executive Command Center</h1>
      <pre>{JSON.stringify(overview, null, 2)}</pre>
    </main>
  );
}
