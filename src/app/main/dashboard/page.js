"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/app/components/Dashboard";
import StaffDashboard from "@/app/components/StaffDashboard";

export default function MainPage() {
  // ✅ remove TypeScript type annotation
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  if (userRole === null) return null; // while loading

  if (
    userRole === "Super Admin" ||
    userRole === "Management" ||
    userRole === "HR" ||
    userRole === "Admin"
  ) {
    return <MainLayout />;
  }

  return <StaffDashboard />;
}
