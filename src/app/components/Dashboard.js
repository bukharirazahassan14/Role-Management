"use client";

import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Briefcase,
  Users,
  User,
  UserPlus,
  TrendingUp,
  ChevronRight,
  List,
  PieChart as PieChartIcon,
  Bell, // Added Bell icon
  Loader2,
  AlertTriangle,
  Activity,
  ThumbsUp,
  XCircle,
  Zap,
} from "lucide-react";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/* ---------------- Modern Toast ---------------- */
function Toast({ message, onClose }) {
  return (
    <div className="relative flex items-center gap-3 w-80 px-4 py-3 rounded-xl shadow-2xl border border-gray-100 bg-white backdrop-blur-sm animate-toast-in">
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

// ⭐️ Master Design Team Member List Row (Compact & Sleek) ⭐️
const TeamMemberListRow = ({ member, index }) => {
  const router = useRouter();

  // Simple Avatar color logic based on the index for visual variety
  const getAvatarColor = (index) => {
    const colors = [
      "from-indigo-500 to-blue-400",
      "from-green-500 to-teal-400",
      "from-pink-500 to-red-400",
      "from-yellow-500 to-amber-400",
    ];
    return colors[index % colors.length];
  };

  const handleRowClick = () => {
    router.push(`/main/UserProfile?userID=${member.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      // Compact Padding (py-2.5) and Master Hover Effect (ring/gray-50)
      className="flex items-center justify-between py-2.5 px-3 transition duration-200 cursor-pointer rounded-lg relative
                   hover:bg-gray-50 hover:ring-2 hover:ring-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      {/* Left Section: Avatar, Name, Email */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div
          // Smaller Avatar (w-8 h-8) and smaller text (text-sm)
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0
                        bg-gradient-to-br ${getAvatarColor(index)}`}
        >
          {member.name?.charAt(0) || "?"}
        </div>
        <div className="min-w-0">
          {/* Smaller but still bold name (text-sm) */}
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {member.name}
          </p>
          {/* Very small email text (text-xs) */}
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
      </div>

      {/* Right Section: Role & Action */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        {/* Role Badge - Smaller font and padding (px-2 py-0.5) and a nicer indigo shade */}
        <span
          className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full 
                         bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm min-w-[60px] justify-center"
        >
          {member.jd}
        </span>

        {/* Navigation Icon - Softer indigo */}
        <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
      </div>
    </div>
  );
};

const getActionStyles = (action) => {
  switch (action) {
    case "Bonus":
      return "bg-green-100 text-green-700 border-green-200";
    case "Nothing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Motivate":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Hr Meeting":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Urgent Meeting":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getActionIcon = (action) => {
  switch (action) {
    case "Bonus":
      return ThumbsUp;
    case "Urgent Meeting":
      return XCircle;
    case "Motivate":
      return Zap;
    default:
      return Activity;
  }
};

// Ensure getActionStyles is defined outside this component
const WeeklySummaryCard = memo(({ weekNumber, month, year }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Use the first month in the selected array (or the current month)
      const selectedMonthNumber =
        Array.isArray(month) && month.length > 0
          ? month[0]
          : new Date().getMonth() + 1;

      // Construct the API URL with query parameters
      const queryParams = new URLSearchParams({
        month: selectedMonthNumber,
        year: year,
        weekNumber: weekNumber || 1, // USE THE PASSED PROP
      }).toString();

      try {
        const response = await fetch(
          `/api/dashboard/weeklysummary?${queryParams}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Error fetching weekly summary:", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year, weekNumber]);

  // 👇 useMemo to process data (add icons and style classes) only when 'results' changes
  const formattedUsers = useMemo(
    () =>
      results.map((user) => {
        const Icon = getActionIcon(user.Action);
        const styleClass = getActionStyles(user.Action);

        return {
          ...user,
          IconComponent: Icon,
          styleClass: styleClass,
        };
      }),
    [results] // Dependency array: only re-calculate if fetched results change
  );

  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-indigo-600">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <p className="text-sm font-medium">Loading Weekly Data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500 p-4 text-center">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <p className="text-sm font-medium">Error: {error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Could not fetch weekly summary.
          </p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 italic p-4 text-center">
          <p className="text-sm">No weekly summary found for this selection.</p>
        </div>
      );
    }

    // LIST CONTENT - SCROLLABLE WRAPPER
    return (
      <div className="space-y-3">
        {formattedUsers.map(
          (
            user // 👈 Use formattedUsers array
          ) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition duration-150 ease-in-out border border-gray-100"
            >
              {/* User Info (Full Name) */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <User className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                <p className="font-semibold text-gray-900 truncate">
                  {user.fullName}
                </p>
              </div>

              {/* Score and Action */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                {/* Total Score */}
                <div className="flex items-center text-sm font-medium text-gray-600 space-x-1">
                  <user.IconComponent className="h-4 w-4 text-gray-400" />{" "}
                  {/* 👈 Dynamic Icon */}
                  <span>Score: {user.totalWeightedRating.toFixed(2)}</span>
                </div>

                {/* Action Tag (Colored Rectangle Border Adage) */}
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${user.styleClass}`}
                >
                  {user.Action}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto pr-2">{renderContent()}</div>
  );
});

// 👇 Fixes the ESLint warning: Component definition is missing display name
WeeklySummaryCard.displayName = "WeeklySummaryCard";

/* ---------------- Main Dashboard ---------------- */
export default function Dashboard() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [roleStats, setRoleStats] = useState({ roles: [], totalCount: 0 });
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const didFetch = useRef(false);
  const [teamMembers, setTeamMembers] = useState([]);

  const [selectedWeek, setSelectedWeek] = useState(1);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonthArray = useMemo(() => [new Date().getMonth() + 1], []);

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString("en-US", {
    month: "short",
  });

  // Helper function to handle week change
  const handleWeekChange = useCallback((newWeek) => {
    // Ensure the new week is between 1 and 4
    if (newWeek >= 1 && newWeek <= 4) {
      setSelectedWeek(newWeek);
    }
  }, []);

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

  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState([currentMonth]);

  /* ---------------- API Fetch: Team Members ---------------- */
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
          jd: u.jd,
          role: u.role ? u.role.description : "No Role",
        }));

        setTeamMembers(formatted);
      } catch (error) {
        console.error("Error fetching team members:", error);
        setTeamMembers(fallbackData);
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
        ringColor: "ring-blue-500", // For the circle
        bgColor: "from-blue-500 to-blue-700", // For the circle
      };
    }
    if (avg >= 3) {
      return {
        performance: "Good",
        colorClass: "text-green-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-green-400 to-emerald-500",
        ringColor: "ring-green-500", // For the circle
        bgColor: "from-green-500 to-green-700", // For the circle
      };
    }
    if (avg >= 2) {
      return {
        performance: "Normal",
        colorClass: "text-yellow-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-yellow-400 to-amber-500",
        ringColor: "ring-yellow-500", // For the circle
        bgColor: "from-yellow-500 to-yellow-700", // For the circle
      };
    }
    if (avg >= 1) {
      return {
        performance: "Partial",
        colorClass: "text-orange-600 font-extrabold",
        barGradientClass: "bg-gradient-to-r from-orange-400 to-red-500",
        ringColor: "ring-orange-500", // For the circle
        bgColor: "from-orange-500 to-orange-700", // For the circle
      };
    }
    return {
      performance: "Poor",
      colorClass: "text-red-600 font-extrabold",
      barGradientClass: "bg-gradient-to-r from-pink-500 to-red-600",
      ringColor: "ring-red-500", // For the circle
      bgColor: "from-red-500 to-red-700", // For the circle
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

  /* ---------------- Initial Fetch (Auth, Notifications, Roles) ---------------- */
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    // --- Authentication placeholder logic (kept as is) ---
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    // Mock token payload parsing for non-login related data
    const payload = parseJwt(token || "a.eyJleHAiOjI1Mzk3MDYxOTk3MjB9.c");
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
          } else {
            setNotifications([]);
          }
        } else {
          throw new Error("Failed to fetch notifications");
        }
      } catch (err) {
        console.error("Notification fetch error:", err);
        // Fallback Mock Data
        setNotifications([
          "🔐 **Critical Alert:** John Smith requested a password reset.",
          "🔐 **Critical Alert:** Jane Doe requested a password reset.",
          "⚠️ API Error: Role data could not be fetched (Fallback).",
          "System Maintenance scheduled for Friday at 2 AM.",
          "Review pending security updates.",
          "Another user requested password change.",
        ]);
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
        // Always ensure at least one month is selected
        const validMonths =
          selectedMonth.length > 0 ? selectedMonth : [currentMonth];
        const monthsParam = validMonths.join(",");

        const res = await fetch(
          `/api/weeklyevaluation/performance/monthly?year=${SerSelectedYear}&months=${monthsParam}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const sortedData = [...data].sort(
          (a, b) => b.avgWeightedRating - a.avgWeightedRating
        );
        setMonthlyPerformance(sortedData);
      } catch (err) {
        console.error("Monthly performance fetch error:", err);
      }
    };

    fetchMonthlyPerformance();
  }, [SerSelectedYear, selectedMonth, currentMonth]);

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
        } else if (
          r.name.toLowerCase().includes("dev") ||
          r.name.toLowerCase().includes("temp")
        ) {
          icon = UserPlus;
          color = "#0d9488";
        }
        return { ...r, icon, hexCode: color };
      }),
    [roleStats]
  );

  // ✅ Define SerNotifyChange
  const SerNotifyChange = (year, month) => {
    // Simply updates the state, triggering the useEffect above
    setSerSelectedYear(year);
    setSelectedMonth(month);
  };

  // ✅ Safely map performance data
  const performanceData = monthlyPerformance.map((u) => ({
    name: u.fullName,
    roleName: u.roleName,
    roleDescription: u.roleDescription,
    avg: Number(u.avgWeightedRating ?? 0),
    act: u.Action,
  }));

  // CALCULATE MONTHLY AVERAGE
  const monthlyAverage = useMemo(() => {
    if (performanceData.length === 0) return 0;
    const total = performanceData.reduce((sum, user) => sum + user.avg, 0);
    return total / performanceData.length;
  }, [performanceData]);

  // Get styles for the monthly average circle
  const {
    performance: monthlyPerformanceText,
    bgColor: monthlyBgColor,
    ringColor: monthlyRingColor,
  } = getPerformanceStyles(monthlyAverage);

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

  const [evaluationPrograms, setEvaluationPrograms] = useState([]);
  // ✅ Fetch evaluation programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch("/api/weeklyevaluation/evaluationprograms");
        if (!res.ok) throw new Error("Failed to fetch programs");
        const data = await res.json();

        // 🧩 Transform API data into the same structure as your static array
        const formattedData = data.map((item) => ({
          name: item.Name,
          weightage: item.Weightage,
          description: item.Description, // optional if you need it
          id: item._id,
        }));

        setEvaluationPrograms(formattedData);
      } catch (err) {
        console.error("❌ Error fetching programs:", err);
      }
    };

    fetchPrograms();
  }, []);

  /* ---------------- JSX ---------------- */
  return (
    // MASTER CHANGE: Padding changed to pt-4 and px-6 for a tighter top fit. Space-y reduced to space-y-6.
    <div className="pt-4 px-6 pb-6 w-full bg-gray-50 min-h-screen space-y-6">
      {/* This div is now essentially padding for the first element */}
      <div className="flex items-center space-x-3">
        {/* Header content removed as requested */}
      </div>

      {/* ---------- Row 1: Key Metrics (3 columns) ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Team Members List (4/12 width) */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 lg:col-span-1">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center space-x-2">
            <List className="h-5 w-5 text-indigo-600" />
            <span>My Team ({teamMembers.length})</span>
          </h3>

          {/* ✅ Keep max height, remove slice → scrollable list */}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <TeamMemberListRow
                  key={member.id}
                  member={member}
                  index={index}
                />
              ))
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 flex items-center justify-center border border-gray-200">
                <p className="text-sm font-medium text-gray-500 text-center py-5">
                  No team members to display.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Roles Distribution (4/12 width) */}
        <div className="relative pt-5 p-6 rounded-3xl bg-white shadow-2xl border border-gray-100 lg:col-span-1">
          {/* Total Count Badge */}
          <div className="absolute top-0 right-6 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-indigo-600 shadow-xl shadow-indigo-400/50 border-4 border-white">
            <span className="text-lg font-extrabold text-white">
              {roleStats.totalCount || 0}
            </span>
          </div>

          <div className="mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <span>Organizational Role Distribution</span>
            </h2>
          </div>

          <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {stats.map((s) => (
              <div
                key={s._id}
                className="flex justify-between items-center py-2 px-4 hover:bg-indigo-50 rounded-xl transition duration-200 shadow-sm border border-gray-100"
                style={{ borderLeft: `5px solid ${s.hexCode}` }}
              >
                <div className="flex items-center space-x-3">
                  <s.icon className="h-4 w-4" style={{ color: s.hexCode }} />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {s.description}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Notification Card (1/3 width) */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 md:col-span-1">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center space-x-2">
            <Bell className="h-5 w-5 text-red-600" />
            <span>Urgent Notifications</span>
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full ml-2">
              {notifications.length}{" "}
              {notifications.length === 1 ? "New" : "Alerts"}
            </span>
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map(
                (
                  msg,
                  index // Show up to 5 notifications
                ) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm"
                  >
                    <Shield className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-gray-700">{msg}</p>
                  </div>
                )
              )
            ) : (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-sm text-green-700 rounded-lg">
                <p>
                  No urgent system alerts or **password reset** requests
                  currently. Everything is green!
                </p>
              </div>
            )}
            {notifications.length > 5 && (
              <p className="text-sm text-gray-500 pt-2 text-center">
                ... and {notifications.length - 5} more notifications.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Row 2: Performance Metrics (2/3 width) and Notifications (1/3 width) ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {" "}
        {/* Card 4: Performance Card (2/3 width) */}
        <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-4 border border-gray-100 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Team Performance Metrics
              </h2>
            </div>

            {/* Controls (The entire filter group) - UNCHANGED */}
            <div className="flex flex-col sm:flex-row gap-4 sm:flex-nowrap">
              {/* 1. Year Selector */}
              <div className="relative w-full sm:w-auto flex-shrink-0">
                <select
                  value={SerSelectedYear}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setSerSelectedYear(newYear);
                    SerNotifyChange(newYear, selectedMonth);
                  }}
                  className="w-full appearance-none px-4 py-1.5 pr-10 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 hover:border-indigo-400"
                >
                  {SerYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              {/* 2. Month Buttons (Multi-select) */}
              <div className="flex gap-1 flex-nowrap">
                {months.map((month, idx) => {
                  const monthNumber = idx + 1;
                  const isSelected = selectedMonth.includes(monthNumber);

                  return (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth((prev) => {
                          let next;

                          if (prev.includes(monthNumber)) {
                            // Remove month if it's already selected
                            next = prev.filter((m) => m !== monthNumber);
                          } else {
                            // Add new month
                            next = [...prev, monthNumber];
                          }

                          // ✅ Prevent empty selection — revert to default month
                          if (next.length === 0) {
                            next = [currentMonth];
                          }

                          // 🔔 Notify parent/state
                          SerNotifyChange(SerSelectedYear, next);

                          return next;
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex-shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md border border-indigo-700"
                          : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance List - Master Design for Performance Bars */}
          {/* 3. REDUCED LIST MAX-HEIGHT from max-h-[350px] to max-h-[250px] */}
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-3 custom-scrollbar">
            {performanceData.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4 font-medium">
                No performance data available for this month.
              </p>
            ) : (
              performanceData.map((user, idx) => {
                const { performance, colorClass, barGradientClass } =
                  getPerformanceStyles(user.avg);

                const badgeColors = {
                  Poor: "bg-red-50 text-red-600 border border-red-200",
                  Normal:
                    "bg-yellow-50 text-yellow-600 border border-yellow-200",
                  Good: "bg-green-50 text-green-600 border border-green-200",
                  Excellent: "bg-blue-50 text-blue-600 border border-blue-200",
                };

                return (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center md:justify-between bg-white hover:bg-gray-50 transition duration-300 rounded-xl p-3 border border-gray-200 shadow-sm"
                  >
                    {/* User Info - UNCHANGED */}
                    <div className="flex items-center space-x-3 w-full md:w-1/3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${barGradientClass}`}
                      >
                        {user.name?.charAt(0) || "-"}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {user.roleDescription}
                        </p>
                      </div>
                    </div>

                    {/* Performance Bar - UNCHANGED */}
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
                        {user.avg.toFixed(2)}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm ${
                          badgeColors[performance] || badgeColors.Poor
                        } flex-shrink-0 min-w-[70px] justify-center text-center`}
                      >
                        {performance || "Poor"}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm ${
                          badgeColors[performance] || badgeColors.Poor
                        } flex-shrink-0 min-w-[70px] justify-center text-center`}
                      >
                        {user.act || "-"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* New: Monthly Average Circle - positioned absolutely relative to this card - UNCHANGED */}
          <div
            className={`absolute bottom-0 right-8 transform translate-y-[80%] 
                w-28 h-28 rounded-full flex flex-col items-center justify-center 
                bg-gradient-to-br ${monthlyBgColor} shadow-xl ${monthlyRingColor} ring-4 ring-white z-10`}
          >
            <p className="text-white text-xs font-medium -mt-2">Team Avg.</p>
            <p className="text-white text-3xl font-extrabold">
              {monthlyAverage.toFixed(2)}
            </p>
            <p className="text-white text-sm font-bold">
              {monthlyPerformanceText}
            </p>
          </div>
        </div>
        {/* Card 3: Weekly Summary (4/12 width) */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 lg:col-span-1">
          {/* Combined Title and Navigation Header */}

<div className="flex flex-col items-center mb-4 pb-2 border-b border-gray-100 w-full">
    
    {/* FIRST ROW: Title (Centered) */}
    <div className="w-full flex justify-center mb-3">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span>Weekly Performance Scoreboard</span>
        </h3>
    </div>

    {/* SECOND ROW: Unified Week Navigation and Month Display (Centered) */}
    <div className="w-full flex justify-center">
        
        {/* Unified Pill Container for Nav and Month */}
        <div className="flex items-center space-x-3 bg-gray-50 p-1.5 rounded-xl shadow-inner border border-gray-100">
            
            {/* Modern Month Display */}
            <div className="flex items-center space-x-1 pl-1 pr-2">
                <span className="text-sm font-extrabold text-blue-700">
                    {currentMonthName} 
                </span>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Week Navigation Arrows and Week Display */}
            <div className="flex space-x-1.5 flex-shrink-0 items-center">
                {/* Left Arrow: Decrement Week */}
                <button
                    onClick={() => handleWeekChange(selectedWeek - 1)}
                    disabled={selectedWeek === 1}
                    className={`p-1 rounded-lg text-sm font-bold transition-all duration-200 
              ${
                selectedWeek === 1
                  ? "text-gray-400 cursor-not-allowed bg-gray-50"
                  : "text-indigo-600 hover:bg-indigo-100" // Subtle hover on interaction
              }`}
                >
                    &lt;
                </button>

                {/* Current Week Display (Slightly less aggressive style) */}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-md flex-shrink-0">
                    Week {selectedWeek}
                </span>

                {/* Right Arrow: Increment Week */}
                <button
                    onClick={() => handleWeekChange(selectedWeek + 1)}
                    disabled={selectedWeek === 4}
                    className={`p-1 rounded-lg text-sm font-bold transition-all duration-200 
              ${
                selectedWeek === 4
                  ? "text-gray-400 cursor-not-allowed bg-gray-50"
                  : "text-indigo-600 hover:bg-indigo-100"
              }`}
                >
                    &gt;
                </button>
            </div>  
            



        </div>
    </div>
</div>

          <div className="w-full h-70 flex items-center justify-center mb-3">
            {/* 🎯 CHANGE HERE: Use new Date() to get the current system date/month/year */}
            <WeeklySummaryCard
              year={currentYear} // 👈 Use stable memoized value
              month={currentMonthArray} // 👈 Use stable memoized array
              weekNumber={selectedWeek}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {" "}
        {/* Card 3: Evaluation Programs Weightage (4/12 width) */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 lg:col-span-1">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5 text-indigo-600" />
            <span>Key performance indicators (KPIs)</span>
          </h3>

          {/* Pie Chart Area (Centered) */}
          <div className="w-full h-40 flex items-center justify-center mb-3">
            <ResponsiveContainer width="90%" height="100%">
              <PieChart>
                <Pie
                  data={evaluationPrograms}
                  dataKey="weightage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={3}
                  stroke="#fff"
                  strokeWidth={2}
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
                  itemStyle={{
                    color: "#4B5563",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend/Captions on the BOTTOM (Compact, two-row layout) */}
          <div className="flex flex-wrap justify-start gap-x-4 gap-y-2">
            {evaluationPrograms.map((prog, idx) => (
              <div
                key={prog.name}
                // Use w-1/2 to force wrapping into two columns
                className="flex items-center justify-between w-[48%] flex-shrink-0"
              >
                {/* Name and color dot */}
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 truncate">
                  <span
                    className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {prog.name}
                </span>
                {/* Percentage */}
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {prog.weightage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Toast ---------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {notifications.slice(5).map((msg, i) => (
          <Toast
            key={i}
            message={msg}
            onClose={() =>
              setNotifications((prev) => prev.filter((_, idx) => idx !== i + 5))
            }
          />
        ))}
      </div>
    </div>
  );
}
