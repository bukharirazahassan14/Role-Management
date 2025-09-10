"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }) {
  const pathname = usePathname();

  const title =
    pathname.includes("/dashboard")
      ? "Dashboard Overview"
      : pathname.includes("/users")
      ? "Users"
      : pathname.includes("/roles")
      ? "Roles"
      : pathname.includes("/weeklyevaluation")
      ? "Weekly Evaluation"
      : "Page";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ✅ Sidebar is rendered only once here */}
      <Sidebar />

      <main className="flex-1">
        <Header title={title} />
        <div className="px-6 pb-10">{children}</div>
      </main>
    </div>
  );
}
