"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  // Helper function to safely decode JWT
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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);

    if (!payload) {
      // Invalid token
      localStorage.removeItem("token");
      router.replace("/login");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      // Token expired
      localStorage.removeItem("token");
      router.replace("/login");
      return;
    }

    // ✅ Token is valid, user stays on dashboard
  }, [router]);

  const stats = [
    { title: "Total Users", value: "50" },
    { title: "Admin Users", value: "2" },
    { title: "Other Users", value: "48" },
    { title: "Active Users", value: "35" },
  ];

  return (
    <div className="p-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-gray-500 font-medium">{stat.title}</h2>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stat.value}</p>
            <span className="text-sm text-green-500">{stat.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
