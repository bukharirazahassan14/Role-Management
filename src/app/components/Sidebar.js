"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, ClipboardCheck } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-20 bg-gradient-to-b from-gray-950 to-indigo-800 text-white flex flex-col items-center py-6 space-y-6 shadow-xl rounded-r-2xl">
      {/* Dashboard */}
      <button
        onClick={() => router.replace("/main/dashboard")}
        className={`p-3 rounded-xl transition ${
          pathname === "/main/dashboard" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <LayoutDashboard size={28} />
      </button>

      {/* Roles */}
      <button
        onClick={() => router.replace("/main/roles")}
        className={`p-3 rounded-xl transition ${
          pathname === "/main/roles" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <Briefcase size={28} />
      </button>

      {/* Users */}
      <button
        onClick={() => router.replace("/main/users")}
        className={`p-3 rounded-xl transition ${
          pathname === "/main/users" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <Users size={28} />
      </button>

      {/* Employee Weekly Evaluation */}
      <button
        onClick={() => router.replace("/main/weeklyevaluation")}
        className={`p-3 rounded-xl transition ${
          pathname === "/main/weeklyevaluation"
            ? "bg-indigo-500"
            : "hover:bg-indigo-400"
        }`}
      >
        <ClipboardCheck size={28} />
      </button>
    </aside>
  );
}
