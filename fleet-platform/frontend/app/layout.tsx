import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Fleet Operations Platform",
  description: "AI-ready fleet management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", background: "#f7fafc" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
