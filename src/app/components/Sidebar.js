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
  const [forms, setForms] = useState([]);

  // ✅ Fetch AccessControlForm data once
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

  // ✅ Build sidebar nav items based on form access rules
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

        // ❌ Hide if noAccess = true
        if (access.noAccess) return false;

        // ❌ Hide if partialAccess.enabled = true but all permissions = false
        if (access.partialAccess?.enabled) {
          const perms = access.partialAccess.permissions || {};
          const hasAnyPermission = Object.values(perms).some(Boolean);
          if (!hasAnyPermission) return false;
        }

        // ✅ Show only if fullAccess = true OR valid partialAccess.enabled
        return access.fullAccess || access.partialAccess?.enabled;
      })
      .map((f) => {
        let path = f.name.toLowerCase().replace(/\s+/g, "");
        if (f.name === "Report") path = "weeklyevaluation";

        return {
          _id: f._id,
          name: f.name,
          href: `/main/${path}`,
          icon:
            f.name === "Dashboard"
              ? LayoutDashboard
              : f.name === "Roles"
              ? Briefcase
              : f.name === "Profile"
              ? Users
              : ClipboardCheck,
        };
      });
  }, [forms]);

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

      {/* ✅ Navigation Links with activeForm saving */}
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const iconSize = isCollapsed ? 28 : 18;

          return (
            <button
              key={item.name}
              onClick={() => {
                // ✅ Save active form ID in localStorage
                localStorage.setItem("activeForm", item._id);
                // ✅ Navigate
                router.replace(item.href);
              }}
              className={`
                w-full flex items-center 
                ${
                  isCollapsed
                    ? "justify-center space-x-0 p-3"
                    : "space-x-2 px-3 py-2"
                } 
                rounded-xl font-semibold transition-all duration-300
                text-xm
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-700 ring-1 ring-white/50"
                    : "text-gray-200 hover:bg-indigo-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                }
              `}
            >
              <Icon
                size={iconSize}
                className="flex-shrink-0 transition-all duration-300"
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
