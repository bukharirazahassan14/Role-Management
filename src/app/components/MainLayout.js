"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Roles from "./Roles"; 

export default function MainLayout() {
  const [activePage, setActivePage] = useState("dashboard");

const title =
    activePage === "dashboard"
      ? "Dashboard Overview"
      : activePage === "users"
      ? "Users"
      : "Roles"; 


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar setActivePage={setActivePage} />

      <main className="flex-1">
        <Header title={title} />
        <div className="px-6 pb-10">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "users" && <Users />}
          {activePage === "roles" && <Roles />}
        </div>
      </main>
    </div>
  );
}
