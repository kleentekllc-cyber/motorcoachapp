"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/analytics", label: "AI Analytics", icon: "🤖" },
  { href: "/trips", label: "Trips", icon: "🚌" },
  { href: "/drivers", label: "Drivers", icon: "👤" },
  { href: "/vehicles", label: "Vehicles", icon: "🚗" },
  { href: "/executive", label: "Executive", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "#1a1f2e",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      height: "100vh",
      overflowY: "auto",
    }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #2d3748" }}>
        <div style={{ fontSize: 11, color: "#718096", marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>Fleet Operations</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>MotorCoach AI</div>
      </div>
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                color: active ? "#fff" : "#a0aec0",
                background: active ? "#2d5be3" : "transparent",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
