import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Fleet Operations Platform</h1>
      <p>AI-ready fleet management system</p>
      <nav style={{ marginTop: "2rem" }}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link href="/dashboard">📊 Dashboard</Link></li>
          <li><Link href="/analytics">🤖 AI Analytics</Link></li>
          <li><Link href="/trips">🚌 Trips</Link></li>
          <li><Link href="/drivers">👤 Drivers</Link></li>
          <li><Link href="/vehicles">🚗 Vehicles</Link></li>
          <li><Link href="/executive">📈 Executive</Link></li>
        </ul>
      </nav>
    </main>
  );
}
