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
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [forms, setForms] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [userID, setUserID] = useState("");
  const [openPerformance, setOpenPerformance] = useState(false);
  const [openPayroll, setOpenPayroll] = useState(false);

  const [performanceButtonPermissions, setPerformanceButtonPermissions] =
    useState({
      evaluation: false,
      goal: false,
      report: false,
      showMenuIcon: false,
    });

  const [payrollButtonPermissions, setPayrollButtonPermissions] = useState({
    setSalary: false,
    viewSalary: false,
    showMenuIcon: false,
  });

  const [activeItem, setActiveItem] = useState(
    typeof window !== "undefined" ? localStorage.getItem("activeForm") : null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const loginID = localStorage.getItem("loginID");
      setUserID(loginID);
      setCurrentUserRole(role);
    }
  }, []);

  // Fetch forms and access control
  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch("/api/UserAccessControl", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data);

        const accessData = JSON.parse(
          localStorage.getItem("userAccess") || "{}"
        );
        const formAccess = accessData.formAccess || [];

        // PERFORMANCE PERMISSIONS
        const performanceForm = data.find(
          (f) => f.name === "Performance Management"
        );
        if (performanceForm) {
          const access = formAccess.find(
            (fa) => String(fa.formId) === String(performanceForm._id)
          );

          if (access) {
            if (access.fullAccess) {
              setPerformanceButtonPermissions({
                evaluation: true,
                goal: true,
                report: true,
                showMenuIcon: true,
              });
            } else {
              const perms = access.partialAccess?.permissions || {};
              const evalAllowed =
                perms.view || perms.edit || perms.add || perms.delete;
              const gapAllowed = perms.applyGAP;
              const rptAllowed = perms.applyRPT;

              const hasAnyPermission =
                evalAllowed || gapAllowed || rptAllowed;

              setPerformanceButtonPermissions({
                evaluation: evalAllowed,
                goal: gapAllowed,
                report: rptAllowed,
                showMenuIcon:
                  access.partialAccess?.enabled && hasAnyPermission,
              });
            }
          }
        }

        // PAYROLL PERMISSIONS
        const payrollForm = data.find((f) => f.name === "Payroll Setup");
        if (payrollForm) {
          const access = formAccess.find(
            (fa) => String(fa.formId) === String(payrollForm._id)
          );

          if (access) {
            if (access.fullAccess) {
              setPayrollButtonPermissions({
                setSalary: true,
                viewSalary: true,
                showMenuIcon: true,
              });
            } else {
              const perms = access.partialAccess?.permissions || {};

              setPayrollButtonPermissions({
                setSalary: perms.applyKpi || false,
                viewSalary: perms.view || false,
                showMenuIcon:
                  access.partialAccess?.enabled &&
                  (perms.applyKpi || perms.view),
              });
            }
          }
        }
      } catch (error) {
        console.error("❌ Error loading forms:", error);
      }
    }

    fetchForms();
  }, []);

  // Handle main or submenu click
  const handleItemClick = (item, subPath = null) => {
    const path = subPath ? `/main/${subPath}` : item.href;

    setActiveItem(subPath || item._id);
    localStorage.setItem("activeForm", item._id);

    if (item.name === "Payroll Setup" && !subPath) {
      if (isCollapsed) {
        router.replace("/main/setsalary");
        return;
      }
      setOpenPayroll(!openPayroll);
      return;
    }

    if (item.name === "Performance Management" && !subPath) {
      if (isCollapsed) {
        router.replace("/main/weeklyevaluation");
        return;
      }
      setOpenPerformance(!openPerformance);
      return;
    }

    router.replace(path);
  };

  // BUILD NAV ITEMS + SUBMENU FLAGS
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
        if (access.fullAccess) return true;

        const perms = access.partialAccess?.permissions || {};
        const hasAnyPermission = Object.values(perms).some(Boolean);
        if (!hasAnyPermission) return false;

        if (
          form.name === "Performance Management" &&
          !performanceButtonPermissions.showMenuIcon
        )
          return false;

        if (
          form.name === "Payroll Setup" &&
          !payrollButtonPermissions.showMenuIcon
        )
          return false;

        return true;
      })
      .map((f) => {
        let path = f.name.toLowerCase().replace(/\s+/g, "");

        if (f.name === "Performance Management") path = "weeklyevaluation";
        if (f.name === "Assets Management") path = "Assets";

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

          // ⭐ SUBMENU FLAG FIX (IMPORTANT)
          submenu:
            f.name === "Performance Management" ||
            f.name === "Payroll Setup",

          icon:
            f.name === "Dashboard"
              ? LayoutDashboard
              : f.name === "Roles"
              ? Briefcase
              : f.name === "Users"
              ? Users
              : f.name === "Payroll Setup"
              ? Wallet
              : f.name === "Assets Management"
              ? Package
              : ClipboardCheck,
        };
      });
  }, [
    forms,
    userID,
    currentUserRole,
    performanceButtonPermissions,
    payrollButtonPermissions,
  ]);

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
        >
          <ToggleIcon size={20} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item._id || pathname === item.href;
          const Icon = item.icon;
          const iconSize = isCollapsed ? 28 : 18;

          const showArrow =
            !isCollapsed &&
            item.submenu &&
            (item.name === "Performance Management" ||
              item.name === "Payroll Setup");

          return (
            <div key={item.name} className="w-full">
              {/* MAIN BUTTON */}
              <div className="relative group w-full">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center 
                    ${
                      isCollapsed
                        ? "justify-center p-2.5"
                        : "justify-between px-2.5 py-1.5"
                    }
                    rounded-xl font-medium text-sm transition-all
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-gray-200 hover:bg-indigo-700/40 hover:text-white"
                    }
                  `}
                >
                  <div
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "space-x-2"
                    }`}
                  >
                    <Icon size={iconSize} />

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
                  </div>

                  {/* ⭐ FIXED ARROW */}
                  {showArrow && (
                    <span>
                      {item.name === "Performance Management" ? (
                        openPerformance ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )
                      ) : item.name === "Payroll Setup" ? (
                        openPayroll ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )
                      ) : null}
                    </span>
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <span
                    className="
                      absolute left-14 top-1/2 -translate-y-1/2 
                      whitespace-nowrap bg-black text-white text-xs 
                      py-1 px-3 rounded-lg shadow-lg opacity-0 
                      group-hover:opacity-100 group-hover:translate-x-1 
                      transition-all duration-200 pointer-events-none
                    "
                  >
                    {item.name}
                  </span>
                )}
              </div>

              {/* PERFORMANCE SUBMENU */}
              {item.name === "Performance Management" &&
                openPerformance &&
                !isCollapsed && (
                  <div className="ml-7 mt-2 space-y-2 border-l border-white/20 pl-4">
                    {performanceButtonPermissions.evaluation && (
                      <button
                        onClick={() =>
                          handleItemClick(item, "weeklyevaluation")
                        }
                        className={`w-full flex items-center text-left text-sm px-3 py-2 rounded-lg ${
                          activeItem === "weeklyevaluation"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
                        }`}
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="ml-2">Performance Evaluation</span>
                      </button>
                    )}

                    {performanceButtonPermissions.goal && (
                      <button
                        onClick={() =>
                          handleItemClick(item, "EvaluationPrograms")
                        }
                        className={`w-full flex items-center text-left text-sm px-3 py-2 rounded-lg ${
                          activeItem === "EvaluationPrograms"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
                        }`}
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="ml-2">Goal Setting</span>
                      </button>
                    )}

                    {performanceButtonPermissions.report && (
                      <button
                        onClick={() =>
                          handleItemClick(item, "performancereports")
                        }
                        className={`w-full flex items-center text-left text-sm px-3 py-2 rounded-lg ${
                          activeItem === "performancereports"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
                        }`}
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="ml-2">Report</span>
                      </button>
                    )}
                  </div>
                )}

              {/* PAYROLL SUBMENU */}
              {item.name === "Payroll Setup" &&
                openPayroll &&
                !isCollapsed && (
                  <div className="ml-7 mt-2 space-y-2 border-l border-white/20 pl-4">
                    {payrollButtonPermissions.setSalary && (
                      <button
                        onClick={() => handleItemClick(item, "setsalary")}
                        className={`w-full flex items-center text-left text-sm px-3 py-2 rounded-lg ${
                          activeItem === "setsalary"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
                        }`}
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="ml-2">Set Salary</span>
                      </button>
                    )}

                    {payrollButtonPermissions.viewSalary && (
                      <button
                        onClick={() => handleItemClick(item, "viewsalary")}
                        className={`w-full flex items-center text-left text-sm px-3 py-2 rounded-lg ${
                          activeItem === "viewsalary"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-indigo-600/30"
                        }`}
                      >
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="ml-2">View Salary</span>
                      </button>
                    )}
                  </div>
                )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
