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
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/* ---------------- Modern Toast ---------------- */
function Toast({ message, onClose }) {
  return (
    <div className="relative flex items-center gap-3 w-80 px-4 py-3 rounded-xl shadow-lg border border-gray-200 bg-white backdrop-blur-sm animate-toast-in">
      {/* Icon */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md text-white text-lg">
        🔔
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-gray-700 leading-snug">
        {message}
      </p>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
      >
        ✖
      </button>

      <style jsx>{`
        /* Entrance Animation */
        .animate-toast-in {
          animation: toastIn 0.35s ease-out;
        }

        @keyframes toastIn {
          from {
            transform: translateX(120%);
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

const UserProfileCard = ({
  member,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}) => {
  // Avatar gradient color
  const avatarBgColor = useMemo(() => {
    const colors = [
      "from-pink-500 via-red-400 to-orange-400",
      "from-green-500 via-emerald-400 to-teal-400",
      "from-indigo-500 via-blue-400 to-cyan-400",
      "from-yellow-500 via-amber-400 to-orange-400",
    ];
    return colors[currentIndex % colors.length];
  }, [currentIndex]);

  return (
    <div className="lg:col-span-4 rounded-3xl p-5 shadow-lg bg-white/80 backdrop-blur-md border border-gray-100 flex flex-col justify-between relative overflow-hidden">
      {/* Floating accent at top */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>

      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
          Team Member
        </h3>
        <span className="text-xs font-semibold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">
          {currentIndex + 1} / {totalCount}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          onClick={() => console.log("Clicked Member ID:", member.id)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-lg mb-3
                      bg-gradient-to-br ${avatarBgColor} ring-2 ring-white ring-offset-2`}
        >
          {member.name?.charAt(0) || "?"}
        </div>

        <p className="text-lg font-bold text-gray-900">{member.name}</p>
        <p className="text-xs text-gray-500 font-medium">{member.email}</p>

        {/* Role Badge */}
        <span className="inline-flex items-center px-3 py-1 mt-2 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 shadow-sm">
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {member.role}
        </span>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-center gap-4 pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full transition-all duration-300 shadow-sm ${
            currentIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-md"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.8 5.2a1 1 0 010 1.4L9.4 10l3.4 3.4a1 1 0 01-1.4 1.4l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalCount - 1}
          className={`p-3 rounded-full transition-all duration-300 shadow-sm ${
            currentIndex === totalCount - 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-md"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.2 14.8a1 1 0 010-1.4L10.6 10 7.2 6.6a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ---------------- Main Dashboard ---------------- */
export default function Dashboard() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [roleStats, setRoleStats] = useState({ roles: [], totalCount: 0 });
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const didFetch = useRef(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalUsers: 0,
    sumRatings: 0,
    overallPerformance: 0,
  });

  // Months
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Years range: current ± 5
  const SerYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  // States
  const [SerSelectedYear, setSerSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // ⭐️ START: NEW CODE FOR SINGLE USER VIEW ⭐️
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const navigatePrev = () =>
    setActiveUserIndex((prev) => Math.max(0, prev - 1));
  const navigateNext = () =>
    setActiveUserIndex((prev) => Math.min(teamMembers.length - 1, prev + 1));

  // Effect to reset index if team members array changes (e.g., re-fetch)
  useEffect(() => {
    setActiveUserIndex(0);
  }, [teamMembers]);

  const activeMember = teamMembers[activeUserIndex];
  // ⭐️ END: NEW CODE FOR SINGLE USER VIEW ⭐️

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/users"); // Adjust URL if needed
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();

        // Map API data to match our display needs
        const formatted = data.map((u) => ({
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role ? u.role.name : "No Role",
        }));

        setTeamMembers(formatted);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchMembers();
  }, []);

  /* ---------------- Helper for Performance Styles ---------------- */
  const getPerformanceStyles = (avg) => {
    if (avg >= 4) {
      return {
        performance: "Excellent",
        colorClass: "text-blue-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-blue-400 to-blue-600",
      };
    }
    if (avg >= 3) {
      return {
        performance: "Good",
        colorClass: "text-green-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-green-400 to-emerald-500",
      };
    }
    if (avg >= 2) {
      return {
        performance: "Normal",
        colorClass: "text-yellow-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-yellow-400 to-amber-500",
      };
    }
    if (avg >= 1) {
      return {
        performance: "Partial",
        colorClass: "text-orange-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-orange-400 to-red-500",
      };
    }
    return {
      performance: "Poor",
      colorClass: "text-red-600 font-extrabold",
      barGradientClass: "bg-gradient-to-r from-pink-500 to-red-600",
    };
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
    } catch {
      return null;
    }
  };

  /* ---------------- Initial Fetch ---------------- */
  useEffect(() => {
    if (didFetch.current) return;
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

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/forgot-password-notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const msgs = data.map(
              (n) =>
                `User ${n.userId.firstName} ${n.userId.lastName} (${n.userId.primaryEmail}) requested a password reset`
            );
            setNotifications([...new Set(msgs)]);
          }
        }
      } catch (err) {
        console.error("Notification fetch error:", err);
      }
    };

    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/roles/userCounts");
        if (res.ok) {
          const data = await res.json();
          setRoleStats(data);
        }
      } catch (err) {
        console.error("Role stats fetch error:", err);
      }
    };

    fetchNotifications();
    fetchRoles();
  }, [router]);

  /* ---------------- Monthly Performance ---------------- */
  useEffect(() => {
    const fetchMonthlyPerformance = async () => {
      try {
        const res = await fetch(
          `/api/weeklyevaluation/performance/monthly?year=${SerSelectedYear}&month=${selectedMonth}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        console.log("data>>>>>>>>>", data);

        // ✅ Sort by avgWeightedRating in descending order
        const sortedData = [...data].sort(
          (a, b) => b.avgWeightedRating - a.avgWeightedRating
        );

        setMonthlyPerformance(sortedData);

        // ✅ Count of users
        const totalUsers = sortedData.length;

        // ✅ Sum of avgWeightedRating
        const sumRatings = sortedData.reduce(
          (sum, user) => sum + (user.avgWeightedRating || 0),
          0
        );

        // ✅ Overall team performance
        const overallPerformance = totalUsers > 0 ? sumRatings / totalUsers : 0;

        console.log("Total Users:", totalUsers);
        console.log("Sum of Ratings:", sumRatings);
        console.log("Overall Team Performance:", overallPerformance.toFixed(2));

        // If you want to store in state for display in UI
        setTeamStats({
          totalUsers,
          sumRatings,
          overallPerformance: overallPerformance.toFixed(2),
        });
      } catch (err) {
        console.error("Monthly performance fetch error:", err);
      }
    };

    fetchMonthlyPerformance();
  }, [SerSelectedYear, selectedMonth]);

  /* ---------------- Derived Stats ---------------- */
  const stats = useMemo(
    () =>
      roleStats.roles.map((r) => {
        let icon = User;
        let color = "#6b7280";
        if (r.name.toLowerCase().includes("super")) {
          icon = Shield;
          color = "#4f46e5";
        } else if (r.name.toLowerCase().includes("manage")) {
          icon = Briefcase;
          color = "#0ea5e9";
        } else if (r.name.toLowerCase().includes("hr")) {
          icon = Users;
          color = "#e11d48";
        } else if (r.name.toLowerCase().includes("temp")) {
          icon = UserPlus;
          color = "#0d9488";
        }
        return { ...r, icon, hexCode: color };
      }),
    [roleStats]
  );

  // ✅ Define SerNotifyChange
  const SerNotifyChange = async (year, month) => {
    try {
      const res = await fetch(
        `/api/weeklyevaluation/performance/monthly?year=${year}&month=${month}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // ✅ Sort by avgWeightedRating in descending order
      const sortedData = [...data].sort(
        (a, b) => b.avgWeightedRating - a.avgWeightedRating
      );

      setMonthlyPerformance(sortedData);
    } catch (err) {
      console.error("Monthly performance fetch error:", err);
    }
  };

  // ✅ Safely map performance data
  const performanceData = monthlyPerformance.map((u) => ({
    name: u.fullName,
    email: u.roleName,
    avg: Number(u.avgWeightedRating ?? 0),
  }));

  const topUser =
    performanceData.length > 0
      ? performanceData.reduce((p, c) => (c.avg > p.avg ? c : p))
      : { name: "No Data", email: "-", avg: 0 };

  /* ---------------- Evaluation Programs ---------------- */
  const evaluationPrograms = [
    { name: "Task Deliverability", weightage: 30 },
    { name: "Reliability & Accountability", weightage: 20 },
    { name: "Efficiency & Problem Solving", weightage: 20 },
    { name: "Growth & Learning", weightage: 15 },
    { name: "Communication & Collaboration", weightage: 15 },
  ];
  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

  /* ---------------- JSX ---------------- */
  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen space-y-8">
      {/* ===== Top Bar: Year & Month Selector (Modernized) ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4 mb-6">
        {/* ---- Year Selector ---- */}
        <div className="relative w-full sm:w-auto">
          <select
            value={SerSelectedYear}
            onChange={(e) => {
              const newYear = Number(e.target.value);
              setSerSelectedYear(newYear);
              SerNotifyChange(newYear, selectedMonth);
            }}
            className="w-full sm:w-auto appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-200 bg-white text-base font-medium text-gray-800 shadow-md transition-all duration-300
                 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 hover:border-indigo-400"
            // Changes: Increased padding (px-4 py-2), larger border radius (rounded-lg), added shadow, enhanced focus/hover styles.
          >
            {SerYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* ▼ Dropdown Arrow (Styled to look more cohesive) */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>

        {/* ---- Month Buttons ---- */}
        <div className="flex flex-wrap gap-2">
          {months.map((month, idx) => {
            const monthNumber = idx + 1;
            const isSelected = selectedMonth === monthNumber;

            return (
              <button
                key={month}
                onClick={() => {
                  setSelectedMonth(monthNumber);
                  SerNotifyChange(SerSelectedYear, monthNumber);
                }}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isSelected
                    ? // Modern Selected State: Stronger indigo, subtle glowing shadow.
                      "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 border border-indigo-700"
                    : // Modern Default State: Very light gray, soft border, better hover.
                      "bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Row 1 ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Performance */}
        <div className="lg:col-span-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-5 border border-gray-100">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-5 pb-3 border-b border-gray-100">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Team Performance Metrics
            </h2>
            <span className="ml-auto px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-semibold shadow">
              {selectedMonth && SerSelectedYear
                ? `${new Date(
                    SerSelectedYear,
                    selectedMonth - 1
                  ).toLocaleString("default", {
                    month: "long",
                  })} ${SerSelectedYear}`
                : "Select Month & Year"}
            </span>
          </div>

          {/* List - REDUCED HEIGHT HERE */}
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {performanceData.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4 font-medium">
                No performance data available for this month.
              </p>
            ) : (
              performanceData.map((user, idx) => {
                const { performance, colorClass, barGradientClass } =
                  getPerformanceStyles(user.avg);

                const badgeColors = {
                  Poor: "bg-red-100 text-red-700 border border-red-200",
                  Normal:
                    "bg-yellow-100 text-yellow-700 border border-yellow-200",
                  Good: "bg-green-100 text-green-700 border border-green-200",
                  Excellent: "bg-blue-100 text-blue-700 border border-blue-200",
                };

                return (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center md:justify-between bg-white hover:shadow-md transition duration-300 rounded-2xl p-3 border border-gray-200"
                  >
                    {/* User Info */}
                    <div className="flex items-center space-x-3 w-full md:w-1/3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${barGradientClass}`}
                      >
                        {user.name?.charAt(0) || "-"}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div className="w-full md:w-2/3 mt-2 md:mt-0 flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${barGradientClass}`}
                          style={{ width: `${(user.avg / 5) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold w-8 text-right ${colorClass}`}
                      >
                        {user.avg.toFixed(1)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm ${
                          badgeColors[performance] || badgeColors.Poor
                        }`}
                      >
                        {performance || "Poor"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Roles */}
        <div className="lg:col-span-4 relative pt-5 p-4 rounded-3xl bg-white shadow-xl border border-gray-100">
          <div className="absolute top-0 right-6 transform -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-indigo-600 shadow-lg shadow-indigo-400/50">
            <span className="text-sm font-extrabold text-white">
              {roleStats.totalCount || 0}
            </span>
          </div>

          <div className="mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center space-x-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Organizational Role Distribution</span>
            </h2>
          </div>

          <div className="space-y-2">
            {stats.map((s) => (
              <div
                key={s._id}
                className="flex justify-between items-center py-1.5 px-3 hover:bg-gray-50 rounded-md border-l-4"
                style={{ borderColor: s.hexCode }}
              >
                <div className="flex items-center space-x-3">
                  <s.icon className="h-4 w-4" style={{ color: s.hexCode }} />
                  <span className="text-sm font-medium text-gray-700">
                    {s.name}:
                  </span>
                </div>
                <span className="text-base font-semibold text-gray-900">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Row 2 ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Card */}
        {teamMembers.length > 0 && activeMember ? (
          <UserProfileCard
            member={activeMember}
            onPrev={navigatePrev}
            onNext={navigateNext}
            currentIndex={activeUserIndex}
            totalCount={teamMembers.length}
            className="lg:col-span-4"
          />
        ) : (
          <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl p-5 border border-gray-100 flex items-center justify-center">
            <p className="text-lg font-medium text-gray-500 text-center py-10">
              No team members to display.
            </p>
          </div>
        )}

        {/* Team Overview Line Chart */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl p-5 border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">
            Team Performance
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { metric: "Total Users", value: teamStats.totalUsers },
                  {
                    metric: "Overall Performance",
                    value: Number(teamStats.overallPerformance),
                  },
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="metric"
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "none",
                  }}
                  itemStyle={{ color: "#4B5563" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{
                    r: 6,
                    fill: "#4f46e5",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation Programs */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl p-4 border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">
            Evaluation Programs
          </h3>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3">
            <div className="w-full lg:w-[55%] h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={evaluationPrograms}
                    dataKey="weightage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="#fff"
                  >
                    {evaluationPrograms.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      border: "none",
                    }}
                    itemStyle={{ color: "#4B5563" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full lg:w-[45%] space-y-2">
              {evaluationPrograms.map((prog, idx) => (
                <div
                  key={prog.name}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-1.5 shadow-sm"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {prog.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {prog.weightage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Toast ---------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
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
