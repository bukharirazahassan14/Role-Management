"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = useState("");

  // ✅ Fetch role from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      setCurrentUserRole(role);
    }
  }, []);

  // ✅ If role is Staff or Temp Staff, show "My Profile" instead of "User Profile"
  const isStaff =
    currentUserRole === "Super Admin" || currentUserRole === "Admin" || currentUserRole === "HR" || currentUserRole === "Manager";

  const title = pathname.includes("/dashboard")
    ? isStaff
      ? "Team Dashboard"
      : "Dashboard"
    : pathname.includes("/users")
    ? isStaff
      ? "User Profile"
      : ""
    : pathname.includes("/roles")
    ? "Roles"
    : pathname.includes("/weeklyevaluation")
    ? "Performance Evaluation"
    : pathname.includes("/WeeklyEvaluationViewEdit")
    ? "Evaluation Overview"
    : pathname.includes("/EvaluationPrograms")
    ? "Evaluation Programs"
     : pathname.includes("/UserAccessControl")
    ? "User Access Control"
    : pathname.includes("/UserProfile")
    ? isStaff
      ? "User Profile"
      : "My Profile"
    : "";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ✅ Sidebar rendered once */}
      <Sidebar />

      <main className="flex-1">
        <Header title={title} />
        <div className="px-6 pb-10">{children}</div>
      </main>
    </div>
  );
}
