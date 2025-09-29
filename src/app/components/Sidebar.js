"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, ClipboardCheck } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-20 bg-gradient-to-b from-gray-950 to-indigo-800 text-white flex flex-col items-center py-6 space-y-6 shadow-xl rounded-r-2xl overflow-visible">
      {/* Dashboard */}
      <div className="relative group">
        <button
          onClick={() => router.replace("/main/dashboard")}
          className={`p-3 rounded-xl transition ${
            pathname === "/main/dashboard" ? "bg-indigo-500" : "hover:bg-indigo-400"
          }`}
        >
          <LayoutDashboard size={28} />
        </button>
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md text-sm bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
          Dashboard
        </span>
      </div>

      {/* Roles */}
      <div className="relative group">
        <button
          onClick={() => router.replace("/main/roles")}
          className={`p-3 rounded-xl transition ${
            pathname === "/main/roles" ? "bg-indigo-500" : "hover:bg-indigo-400"
          }`}
        >
          <Briefcase size={28} />
        </button>
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md text-sm bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
          Roles
        </span>
      </div>

      {/* Users */}
      <div className="relative group">
        <button
          onClick={() => router.replace("/main/users")}
          className={`p-3 rounded-xl transition ${
            pathname === "/main/users" ? "bg-indigo-500" : "hover:bg-indigo-400"
          }`}
        >
          <Users size={28} />
        </button>
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md text-sm bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
          Users
        </span>
      </div>

      {/* Employee Weekly Evaluation */}
      <div className="relative group">
        <button
          onClick={() => router.replace("/main/weeklyevaluation")}
          className={`p-3 rounded-xl transition ${
            pathname === "/main/weeklyevaluation" ? "bg-indigo-500" : "hover:bg-indigo-400"
          }`}
        >
          <ClipboardCheck size={28} />
        </button>
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md text-sm bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
          Evaluation
        </span>
      </div>
    </aside>
  );
}
