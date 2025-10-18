"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  User,
  CheckCircle2,
  FileBarChart2,
  UserCog,
  UserPlus2,
  Briefcase,
  Plus,
} from "lucide-react";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export default function Roles() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);

  // ✅ Token verification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      router.push("/login");
    }
  }, [router]);

  // ✅ Fetch roles from API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    }

    fetchRoles();
  }, []);

  // ✅ Color theme mapping
  const colorClasses = {
    emerald: {
      bg: "bg-gradient-to-r from-emerald-500 to-lime-500",
      text: "text-emerald-700 group-hover:text-emerald-800",
      border: "hover:border-emerald-400",
      footerBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      footerIcon: "text-emerald-600",
      glow: "bg-gradient-to-r from-emerald-400 to-lime-400",
    },
    indigo: {
      bg: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
      text: "text-gray-900 group-hover:text-indigo-600",
      border: "hover:border-indigo-300",
      footerBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
      footerIcon: "text-indigo-600",
      glow: "bg-gradient-to-r from-indigo-500 to-pink-500",
    },
    pink: {
      bg: "bg-gradient-to-r from-pink-500 to-rose-400",
      text: "text-gray-900 group-hover:text-pink-600",
      border: "hover:border-pink-300",
      footerBg: "bg-pink-50 border-pink-200 text-pink-700",
      footerIcon: "text-pink-600",
      glow: "bg-gradient-to-r from-pink-500 to-rose-400",
    },
    blue: {
      bg: "bg-gradient-to-r from-blue-500 to-cyan-400",
      text: "text-gray-900 group-hover:text-blue-600",
      border: "hover:border-blue-300",
      footerBg: "bg-blue-50 border-blue-200 text-blue-700",
      footerIcon: "text-blue-600",
      glow: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
    gray: {
      bg: "bg-gradient-to-r from-gray-400 to-gray-500",
      text: "text-gray-900 group-hover:text-gray-700",
      border: "hover:border-gray-300",
      footerBg: "bg-gray-50 border-gray-200 text-gray-700",
      footerIcon: "text-gray-600",
      glow: "bg-gradient-to-r from-gray-400 to-gray-500",
    },
  };

  // Default icons by role name
  const iconMap = {
    "Super Admin": Users,
    Management: UserCheck,
    HR: UserPlus,
    Staff: User,
    "Temp Staff": UserMinus,
  };

  const footerIconMap = {
    "Super Admin": CheckCircle2,
    Management: FileBarChart2,
    HR: UserPlus2,
    Staff: Briefcase,
    "Temp Staff": UserCog,
  };

  return (
    <div className="p-8">
      {/* Roles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role, i) => {
          const colorKeys = Object.keys(colorClasses);
          const colorKey = colorKeys[i % colorKeys.length];
          const style = colorClasses[colorKey];

          const Icon = iconMap[role.name] || User;
          const FooterIcon = footerIconMap[role.name] || CheckCircle2;

          const handleClick = () => {
            const query = new URLSearchParams({
              roleName: role.name,
              roleDescription: role.description,
            }).toString();
            router.push(`/main/UserAccessControl?${query}`);
          };

          return (
            <div
              key={role._id}
              onClick={handleClick}
              className={`
                group relative flex flex-col items-center justify-between
                rounded-2xl p-8 cursor-pointer
                bg-white/80 backdrop-blur-sm
                shadow-lg hover:shadow-2xl border border-gray-100
                transition-all duration-300 hover:-translate-y-2
                ${style.border}
              `}
            >
              {/* Icon */}
              <div
                className={`
                  absolute -top-6 flex items-center justify-center
                  h-16 w-16 rounded-full shadow-md
                  ${style.bg}
                  group-hover:scale-110 transition-transform duration-300
                `}
              >
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Icon className={`h-7 w-7 ${style.footerIcon}`} />
                </div>
              </div>

              {/* Title */}
              <div className="mt-12 text-center">
                <h3 className={`text-xl font-semibold mb-2 ${style.text}`}>
                  {role.description}
                </h3>
              </div>

              {/* Footer */}
              <div
                className={`
                  mt-6 flex items-center justify-center gap-2
                  px-4 py-2 rounded-xl
                  text-sm font-medium border shadow-sm
                  ${style.footerBg}
                `}
              >
                <FooterIcon className={`w-5 h-5 ${style.footerIcon}`} />
                Access Control
              </div>

              {/* Glow */}
              <div
                className={`absolute inset-x-0 bottom-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${style.glow}`}
              />
            </div>
          );
        })}
      </div>

      {/* ➕ Floating Add Button */}
      <div className="group fixed bottom-8 right-8 z-50">
        <button
          className="
            h-16 w-16 rounded-full flex items-center justify-center
            bg-gradient-to-r from-indigo-500 to-pink-500 text-white
            shadow-lg shadow-indigo-300 hover:shadow-xl hover:scale-110 hover:rotate-90
            transition-all duration-300 ease-out animate-bounce
          "
          aria-label="Add new role"
        >
          <Plus className="w-7 h-7" />
        </button>
        <span
          className="
            absolute -top-12 left-1/2 -translate-x-1/2
            px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg
            shadow-md opacity-0 group-hover:opacity-100 translate-y-2
            group-hover:translate-y-0 transition-all duration-300 pointer-events-none
            whitespace-nowrap
          "
        >
          Add New Role
        </span>
      </div>
    </div>
  );
}
