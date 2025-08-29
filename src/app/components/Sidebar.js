"use client";
import { useState } from "react";
import { LayoutDashboard, Users, Briefcase } from "lucide-react";

export default function Sidebar({ setActivePage }) {
  const [active, setActive] = useState("dashboard");

  const handleClick = (page) => {
    setActive(page);
    setActivePage(page); // now it works because MainLayout passed it
  };

  return (
    <aside className="w-20 bg-gradient-to-b from-gray-950 to-indigo-800 text-white flex flex-col items-center py-6 space-y-6 shadow-xl rounded-r-2xl">
      {/* Dashboard */}
      <button
        onClick={() => handleClick("dashboard")}
        className={`p-3 rounded-xl transition ${
          active === "dashboard" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <LayoutDashboard size={28} />
      </button>

      {/* Roles */}
      <button
        onClick={() => handleClick("roles")}
        className={`p-3 rounded-xl transition ${
          active === "roles" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <Briefcase size={28} />
      </button>

      {/* Users */}
      <button
        onClick={() => handleClick("users")}
        className={`p-3 rounded-xl transition ${
          active === "users" ? "bg-indigo-500" : "hover:bg-indigo-400"
        }`}
      >
        <Users size={28} />
      </button>

      
    </aside>
  );
}
