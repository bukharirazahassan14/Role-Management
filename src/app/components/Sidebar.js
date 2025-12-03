"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [forms, setForms] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [userID, setUserID] = useState("");
  const [openPerformance, setOpenPerformance] = useState(false);

  // NEW: payroll submenu state
  const [openPayroll, setOpenPayroll] = useState(false);

  // Fetch role from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const loginID = localStorage.getItem("loginID");
      setUserID(loginID);
      setCurrentUserRole(role);
    }
  }, []);

  // Fetch AccessControlForm data once
  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch("/api/UserAccessControl", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data);
      } catch (error) {
        console.error("❌ Error loading forms:", error);
      }
    }

    fetchForms();
  }, []);

  // Build sidebar nav items based on form access rules
  const navItems = useMemo(() => {
    if (forms.length === 0) return [];

    const accessData = JSON.parse(localStorage.getItem("userAccess") || "{}");
    const formAccess = accessData.formAccess || [];

    return forms
      .filter((form) => {
        const access = formAccess.find(
          (a) => String(a.formId) === String(form._id)
        );
        if (!access) return false;

        if (access.noAccess) return false;

        if (access.partialAccess?.enabled) {
          const perms = access.partialAccess.permissions || {};
          const hasAnyPermission = Object.values(perms).some(Boolean);
          if (!hasAnyPermission) return false;
        }

        return access.fullAccess || access.partialAccess?.enabled;
      })
      .map((f) => {
        let path = f.name.toLowerCase().replace(/\s+/g, "");
        if (f.name === "PMS") path = "weeklyevaluation";

        if (
          f.name === "Users" &&
          !["Super Admin", "Admin", "HR", "Manager"].includes(currentUserRole)
        ) {
          path = `UserProfile?userID=${userID}`;
        }

        return {
          _id: f._id,
          name: f.name,
          href: `/main/${path}`,
          icon:
            f.name === "Dashboard"
              ? LayoutDashboard
              : f.name === "Roles"
              ? Briefcase
              : f.name === "Users"
              ? Users
              : f.name === "Payroll Setup"
              ? Wallet
              : ClipboardCheck,
        };
      });
  }, [forms, userID, currentUserRole]);

  const sidebarWidth = isCollapsed ? "w-17" : "w-68";
  const sidebarPadding = isCollapsed ? "px-2" : "px-3";
  const ToggleIcon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={`${sidebarWidth} ${sidebarPadding} bg-gradient-to-b from-gray-950 to-indigo-800 text-white 
        flex flex-col py-6 space-y-4 shadow-xl h-screen sticky top-0 z-20 rounded-r-2xl
        transition-all duration-300 ease-in-out`}
    >
      {/* Toggle Button */}
      <div
        className={`flex ${
          isCollapsed ? "justify-center" : "justify-end"
        } mb-4`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-full text-indigo-300 bg-gray-900/50 hover:text-white hover:bg-indigo-600 border border-transparent hover:border-white/20 transition duration-300"
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <ToggleIcon size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const iconSize = isCollapsed ? 28 : 18;

          return (
            <div key={item.name} className="w-full">
              {/* MAIN BUTTON */}
              <button
                onClick={() => {
                  localStorage.setItem("activeForm", item._id);

                  // ➤ Payroll Setup behavior
                  if (item.name === "Payroll Setup") {
                    // If sidebar is collapsed → directly open Set Salary page
                    if (isCollapsed) {
                      router.replace("/main/setsalary");
                      return;
                    }

                    // If expanded → toggle submenu
                    setOpenPayroll(!openPayroll);
                    return;
                  }

                  // ➤ Performance Management behavior
                  if (item.name === "PMS") {
                    if (isCollapsed) {
                      router.replace("/main/weeklyevaluation");
                      return;
                    }

                    setOpenPerformance(!openPerformance);
                    return;
                  }

                  router.replace(item.href);
                }}
                className={`
  w-full flex items-center 
  ${isCollapsed ? "justify-center space-x-0 p-2.5" : "space-x-2 px-2.5 py-1.5"} 
  rounded-xl font-medium transition-all duration-300
  text-sm
  ${
    isActive
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700 ring-1 ring-white/50"
      : "text-gray-200 hover:bg-indigo-700/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
  }
`}
              >
                <Icon
                  size={iconSize}
                  className="flex-shrink-0 transition-all duration-300"
                />

                {!isCollapsed && (
                  <span className="truncate">
                    {["Super Admin", "Admin", "HR", "Manager"].includes(
                      currentUserRole
                    )
                      ? item.name
                      : item.name === "Users"
                      ? "My Profile"
                      : item.name}
                  </span>
                )}

                {/* ARROW FOR PAYROLL & PERFORMANCE MANAGEMENT */}
                {!isCollapsed &&
                  (item.name === "Payroll Setup" || item.name === "PMS") && (
                    <ChevronRight
                      size={18}
                      className={`ml-auto transform transition-transform duration-300 ${
                        (item.name === "Payroll Setup" && openPayroll) ||
                        (item.name === "PMS" && openPerformance)
                          ? "rotate-90 text-white"
                          : ""
                      }`}
                    />
                  )}
              </button>

              {/* SUBMENU */}
              {item.name === "Payroll Setup" && openPayroll && !isCollapsed && (
                <div className="ml-7 mt-2 space-y-2 border-l border-white/20 pl-4 transition-all">
                  {/* Modern Set Salary Button */}
                  <button
                    onClick={() => router.replace("/main/setsalary")}
                    className="w-full flex items-center justify-between text-left text-sm text-gray-300 hover:text-white hover:bg-indigo-600/30 px-3 py-2 rounded-lg shadow-sm transition duration-200"
                  >
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span>Set Salary (Master Data)</span>
                  </button>

                  {/* Modern Payslip Button */}
                  <button
                    onClick={() => router.replace("/main/payslip")}
                    // Removed justify-between from here, as it forces maximum space
                    className="w-full flex items-center text-left text-sm text-gray-300 hover:text-white hover:bg-indigo-600/30 px-3 py-2 rounded-lg shadow-sm transition duration-200"
                  >
                    {/* 👇 Group the icon and text together in a new flex container */}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span>Payslip</span>
                    </div>
                  </button>
                </div>
              )}

              {/* PERFORMANCE MANAGEMENT SUBMENU */}
              {item.name === "PMS" && openPerformance && !isCollapsed && (
                <div className="ml-7 mt-2 space-y-2 border-l border-white/20 pl-4 transition-all">
                  {/* Performance Evaluation */}
                  <button
                    onClick={() => router.replace("/main/weeklyevaluation")}
                    className={`
        w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg shadow-sm transition duration-200
        ${
          pathname === "/main/weeklyevaluation"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700"
            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
        }
      `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span>Performance Evaluation</span>
                    </div>
                  </button>

                  {/* Goal Setting */}
                  <button
                    onClick={() => router.replace("/main/EvaluationPrograms")}
                    className={`
        w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg shadow-sm transition duration-200
        ${
          pathname === "/main/EvaluationPrograms"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700"
            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
        }
      `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span>Goal Setting</span>
                    </div>
                  </button>

                  {/* Report */}
                  <button
                    onClick={() => router.replace("/main/performancereports")}
                    className={`
        w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg shadow-sm transition duration-200
        ${
          pathname === "/main/performancereports"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700"
            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
        }
      `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span>Report</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
