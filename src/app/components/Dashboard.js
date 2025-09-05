"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react"; // modern active user icon

// ✅ Toast (unchanged)
function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="bg-white shadow-2xl rounded-xl p-4 border border-gray-200 animate-slide-in flex items-center space-x-3">
        <div className="bg-indigo-500 text-white p-2 rounded-full">🔔</div>
        <div>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          ✖
        </button>
      </div>

      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const didFetch = useRef(false); // ✅ prevents duplicate API calls

  // ✅ Decode JWT
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
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (didFetch.current) return; // ✅ stop second call
    didFetch.current = true;

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      router.replace("/login");
      return;
    }

    // ✅ Fetch Active Users
    async function fetchActiveUsers() {
      try {
        const res = await fetch("/api/users/active-count");
        if (res.ok) {
          const data = await res.json();
          setActiveUsers(data.activeUsers);
        }
      } catch (err) {
        console.error("Active users fetch error:", err);
      }
    }

    // ✅ Fetch forgot-password notifications
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/forgot-password-notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setNotifications(
              data.map(
                (n) =>
                  `User ${n.userId.firstName} ${n.userId.lastName} (${n.userId.primaryEmail}) requested a password reset`
              )
            );
          }
        }
      } catch (err) {
        console.error("Notification fetch error:", err);
      }
    }

    fetchActiveUsers();
    fetchNotifications();
  }, [router]);

  return (
    <div className="p-8 w-full">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Active Users Card (Inline Row Layout) */}
        <div className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition flex items-center justify-between">
          {/* Left Section (Icon + Label) */}
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-gray-700 font-medium">Active Users</h2>
          </div>

          {/* Right Section (Number) */}
          <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
        </div>
      </div>

      {/* ✅ Toast Notifications */}
      {notifications.map((msg, i) => (
        <Toast
          key={i}
          message={msg}
          onClose={() =>
            setNotifications((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      ))}
    </div>
  );
}
