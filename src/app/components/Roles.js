"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserPlus, UserMinus, User } from "lucide-react";

// Simplified roles array with the minimal display and the requested names
const roles = [
  { name: "Super Admin", description: "Super Admin", icon: Users },
  { name: "Management", description: "Management", icon: UserCheck },
  { name: "HR", description: "HR", icon: UserPlus },
  // Keeping the original "name" fields but updating the visible "description"
  { name: "Staff", description: "Team", icon: User },
  { name: "Temp Staff", description: "Associate", icon: UserMinus },
];

// ✅ helper function to safely parse JWT
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);

    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      // token missing or expired
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      router.push("/login");
    }
  }, [router]);

  return (
    // Removed specific background color, relying on parent layout/body style
    <div className="p-8">
      {/* NO HEADINGS/TITLES HERE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.name}
              className="
                group relative flex flex-col items-center
                rounded-2xl p-8 cursor-pointer
                bg-white/80 backdrop-blur-sm
                shadow-lg hover:shadow-2xl
                border border-gray-100
                transition-all duration-300
                hover:-translate-y-2 hover:border-indigo-300
              "
            >
              {/* Gradient accent ring behind the icon (Kept from original design) */}
              <div
                className="
                  absolute -top-6 flex items-center justify-center
                  h-16 w-16 rounded-full
                  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                  shadow-md group-hover:scale-110 transition-transform duration-300
                "
              >
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Icon className="h-7 w-7 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                </div>
              </div>

              {/* Title (Uses role.description, which now holds the requested display name) */}
              <div className="mt-12 text-center">
                <h3
                  className="
                    text-xl font-semibold text-gray-900 mb-2
                    group-hover:text-indigo-600 transition-colors
                  "
                >
                  {/* The display name (e.g., Team, Associate) is in role.description */}
                  {role.description} 
                </h3>
              </div>

              {/* Bottom Glow (Kept from original design) */}
              <div
                className="
                  absolute inset-x-0 bottom-0 h-1
                  bg-gradient-to-r from-indigo-500 to-pink-500
                  rounded-b-2xl opacity-0
                  group-hover:opacity-100 transition-opacity duration-300
                "
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}