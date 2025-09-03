"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserPlus, UserMinus, User } from "lucide-react";

const roles = [
  { name: "Super Admin", description: "Has full access to the system", icon: Users },
  { name: "Management", description: "Manages overall operations", icon: UserCheck },
  { name: "HR", description: "Handles employee management", icon: UserPlus },
  { name: "Staff", description: "General staff role", icon: User },
  { name: "Temp Staff", description: "Temporary staff with limited access", icon: UserMinus },
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
    <div className="p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.name}
              className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300"
            >
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <Icon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{role.name}</h3>
              <p className="text-gray-500 text-center">{role.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
