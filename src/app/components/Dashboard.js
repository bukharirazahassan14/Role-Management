"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  UserCheck,
  Shield,
  Briefcase,
  Users,
  User,
  UserPlus,
  Zap,
  TrendingUp,
} from "lucide-react"; // Assuming 'lucide-react'
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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

  const CIRCLE_SIZE_CLASSES = "w-12 h-12"; // Icon container size
  const ICON_SIZE_CLASSES = "h-5 w-5"; // Icon size

  // --- HELPER FUNCTION: Maps AVG score to Performance data ---
  const getPerformanceStyles = (avg) => {
    let colorClass = "text-gray-600";
    let barGradientClass = "bg-gradient-to-r from-gray-300 to-gray-400";
    let performance = "N/A";

    if (avg >= 4.6) {
      performance = "Excellent";
      colorClass = "text-blue-600 font-extrabold";
      barGradientClass = "bg-gradient-to-r from-blue-400 to-blue-600";
    } else if (avg >= 3.6) {
      performance = "Good";
      colorClass = "text-green-600 font-extrabold";
      barGradientClass = "bg-gradient-to-r from-green-400 to-emerald-500";
    } else if (avg >= 2.6) {
      performance = "Normal";
      colorClass = "text-yellow-600 font-extrabold";
      barGradientClass = "bg-gradient-to-r from-yellow-400 to-amber-500";
    } else if (avg >= 1.6) {
      performance = "Partial";
      colorClass = "text-orange-600 font-extrabold";
      barGradientClass = "bg-gradient-to-r from-orange-400 to-red-500";
    } else {
      performance = "Poor";
      colorClass = "text-red-600 font-extrabold";
      barGradientClass = "bg-gradient-to-r from-pink-500 to-red-600";
    }

    return { performance, colorClass, barGradientClass };
  };

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
            // Map messages
            const msgs = data.map(
              (n) =>
                `User ${n.userId.firstName} ${n.userId.lastName} (${n.userId.primaryEmail}) requested a password reset`
            );

            // ✅ Remove duplicates
            const uniqueMsgs = [...new Set(msgs)];

            setNotifications(uniqueMsgs);
          }
        }
      } catch (err) {
        console.error("Notification fetch error:", err);
      }
    }

    fetchActiveUsers();
    fetchNotifications();
  }, [router]);

   // 🛑 FIX APPLIED: Memoize the STATIC part of the stats array
  const staticStats = useMemo(() => [
    {
      id: 2,
      name: "Super Admin",
      value: 1,
      icon: Shield,
      circleBg:
        "bg-gradient-to-tr from-purple-400 via-indigo-500 to-indigo-600",
      hexCode: "#4f46e5", // indigo-600
    },
    {
      id: 3,
      name: "Management",
      value: 3,
      icon: Briefcase,
      circleBg: "bg-gradient-to-tr from-blue-400 via-cyan-500 to-blue-600",
      hexCode: "#0ea5e9", // sky-500
    },
    {
      id: 4,
      name: "HR",
      value: 2,
      icon: Users,
      circleBg: "bg-gradient-to-tr from-pink-400 via-rose-500 to-rose-600",
      hexCode: "#e11d48", // rose-600
    },
    {
      id: 5,
      name: "Staff",
      value: 10,
      icon: User,
      circleBg: "bg-gradient-to-tr from-orange-400 via-amber-500 to-amber-600",
      hexCode: "#f59e0b", // amber-500
    },
    {
      id: 6,
      name: "Temp Staff",
      value: 4,
      icon: UserPlus,
      circleBg: "bg-gradient-to-tr from-teal-400 via-green-500 to-teal-600",
      hexCode: "#0d9488", // teal-600
    },
  ], []);

  // 🛑 FIX APPLIED: Construct the final stats array using activeUsers state
  const stats = useMemo(() => [
    {
      id: 1,
      name: "Active Users",
      value: activeUsers, // Depends on state
      icon: UserCheck,
      circleBg: "bg-gradient-to-tr from-green-400 via-emerald-500 to-green-600",
      hexCode: "#059669", 
    },
    ...staticStats,
  ], [activeUsers, staticStats]); // Dependencies are clean!
  
  const performanceData = [
    { name: "Ali Khan", email: "ali.khan@example.com", avg: 4.6 },
    { name: "Sara Ahmed", email: "sara.ahmed@example.com", avg: 3.9 },
    { name: "Hassan Bukhari", email: "hassan.bukhari@example.com", avg: 4.2 },
    { name: "Zara Noor", email: "zara.noor@example.com", avg: 5.0 },
    { name: "Ahmed Faheem", email: "ahmed.faheem@example.com", avg: 3.5 },
    { name: "Layla Tariq", email: "layla.tariq@example.com", avg: 4.8 },
    { name: "Usman Malik", email: "usman.malik@example.com", avg: 4.1 },
    { name: "Sana Khawaja", email: "sana.khawaja@example.com", avg: 3.7 },
    { name: "Bilal Raza", email: "bilal.raza@example.com", avg: 4.5 },
    { name: "Kiran Junaid", email: "kiran.junaid@example.com", avg: 4.3 },
    { name: "Faisal Iqbal", email: "faisal.iqbal@example.com", avg: 3.2 },
    { name: "Hira Abbasi", email: "hira.abbasi@example.com", avg: 4.9 },
    { name: "Imran Saeed", email: "imran.saeed@example.com", avg: 2.1 },
    { name: "Nida Haider", email: "nida.haider@example.com", avg: 1.5 },
    { name: "Omer Zia", email: "omer.zia@example.com", avg: 4.4 },
  ];
  
  // The totalUsers useMemo now only depends on the memoized 'stats' array
  const totalUsers = useMemo(() => {
    return stats.reduce((sum, stat) => sum + stat.value, 0);
  }, [stats]); 

  return (
    <div className="p-10 w-full bg-gray-50 min-h-screen">
      {/* ---------- Two-Column Layout (40/60 split) ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* -------------------- Left Column: Organizational Role Distribution (40% width) -------------------- */}
        <div
          className="lg:col-span-4 group relative pt-12 p-8 rounded-3xl min-h-[350px]
                       bg-white shadow-2xl shadow-indigo-100/80 border border-gray-100
                       transition duration-500 hover:shadow-indigo-200/90"
        >
          {/* Overlapping Icon: Displays Total Count */}
          <div
            className={`absolute top-0 right-8 transform -translate-y-1/2
                        ${CIRCLE_SIZE_CLASSES} rounded-full
                        flex items-center justify-center bg-indigo-600
                        shadow-xl shadow-indigo-500/50`}
          >
            <span className="text-xl font-extrabold text-white">
              {totalUsers}
            </span>
          </div>

          {/* Card Header: Professional Title */}
          <div className="mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="h-6 w-6 text-indigo-500" />
              <span>Organizational Role Distribution</span>
            </h2>
          </div>

          {/* Detailed User Breakdown List (Vertical, single-column list) */}
          <div className="space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex justify-between items-center py-2 px-3 transition duration-300 hover:bg-gray-50 rounded-lg border-l-4"
                style={{ borderColor: stat.hexCode }}
              >
                <div className="flex items-center space-x-3">
                  <stat.icon
                    className="h-5 w-5 opacity-70"
                    style={{ color: stat.hexCode }}
                  />
                  <span className="text-base font-semibold text-gray-700">
                    {stat.name}:
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-gray-900">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Subtle Accent at the bottom (enhanced style) */}
          <div className="absolute inset-x-0 bottom-0 h-1 rounded-b-3xl bg-indigo-500 opacity-0 transition duration-500 group-hover:opacity-100 scale-x-105" />
        </div>

        {/* ---------- Right Column: Team Performance Metrics (60% width) ---------- */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-2xl shadow-gray-100/80 p-8 border border-gray-100">
          {/* Modern Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span>Team Performance Metrics</span>
            </h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1">
              <span>View Full Report</span>
              <Zap className="h-4 w-4" />
            </button>
          </div>

          {/* Core Vertical User List (Scrollable if height exceeds container) */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {performanceData.map((user, idx) => {
              const { performance, colorClass, barGradientClass } =
                getPerformanceStyles(user.avg);

              return (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center md:justify-between 
                            bg-white hover:bg-gray-50 transition duration-300 rounded-xl p-4 border border-gray-200 hover:shadow-md"
                >
                  {/* User info and Avatar */}
                  <div className="flex items-center space-x-4 w-full md:w-1/3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-opacity-20 ${colorClass
                        .replace("text-", "bg-")
                        .replace("font-extrabold", "")}`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Avg Rating Bar and Score (Primary Focus) */}
                  <div className="w-full md:w-2/3 mt-3 md:mt-0 flex items-center space-x-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        // Dynamic Gradient Bar
                        className={`h-3 rounded-full ${barGradientClass} transition-all duration-700 ease-out`}
                        style={{ width: `${(user.avg / 5) * 100}%` }}
                      />
                    </div>
                    {/* Dynamic Score Text Color */}
                    <span className={`text-lg w-12 text-right ${colorClass}`}>
                      {user.avg.toFixed(1)}
                    </span>
                    {/* Performance Text */}
                    <span className="text-xs font-medium text-gray-500 w-16 text-left">
                      ({performance})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Toast Notifications ---------- */}
      {/* 🛑 UPDATED: Using fixed positioning for a modern stacking effect */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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
    </div>
  );
}
