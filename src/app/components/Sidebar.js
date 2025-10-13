"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

 // Dynamically build nav items based on user role
  const navItems = useMemo(() => {
    const baseItems = [ // Renamed 'items' to 'baseItems' for clarity
      {
        name: "Dashboard",
        href: "/main/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Roles",
        href: "/main/roles",
        icon: Briefcase,
      },
      {
        name: "Profile",
        href: "/main/users",
        icon: Users,
      },
      {
        name: "Evaluation",
        href: "/main/weeklyevaluation",
        icon: ClipboardCheck,
      },
    ];

    let finalItems = baseItems;

    // 1. For Staff/Temp Staff, filter out "Roles"
    if (userRole === "Staff" || userRole === "Temp Staff") {
      finalItems = baseItems.filter((item) => item.name !== "Roles");
    } 
    // For other roles, finalItems remains baseItems (Roles is included)

    // 2. Rename "Evaluation" to "Report" for ALL roles
    return finalItems.map((item) =>
      item.name === "Evaluation" ? { ...item, name: "Report" } : item
    );
    
  }, [userRole]);

  const sidebarWidth = isCollapsed ? "w-20" : "w-40";
  const sidebarPadding = isCollapsed ? "px-2" : "px-3";
  const ToggleIcon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={`${sidebarWidth} ${sidebarPadding} bg-gradient-to-b from-gray-950 to-indigo-800 text-white 
        flex flex-col py-6 space-y-4 shadow-xl h-screen sticky top-0 z-20 rounded-r-2xl
        transition-all duration-300 ease-in-out`}
    >
      {/* Toggle Button */}
      <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"} mb-4`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-full text-indigo-300 bg-gray-900/50 hover:text-white hover:bg-indigo-600 border border-transparent hover:border-white/20 transition duration-300"
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <ToggleIcon size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const iconSize = isCollapsed ? 28 : 18;

          return (
            <button
              key={item.name}
              onClick={() => router.replace(item.href)}
              className={`
                w-full flex items-center 
                ${isCollapsed ? "justify-center space-x-0 p-3" : "space-x-2 px-3 py-2"} 
                rounded-xl font-semibold transition-all duration-300
                text-xm
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700 ring-1 ring-white/50"
                    : "text-gray-200 hover:bg-indigo-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                }
              `}
            >
              <Icon size={iconSize} className="flex-shrink-0 transition-all duration-300" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
