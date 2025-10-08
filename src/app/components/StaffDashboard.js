import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  User,
  Mail,
  Calendar,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Flame,
  BellRing,
  Briefcase,
} from "lucide-react";

const STATS_DATA = {
  leaveBalance: 12,
  totalLeaveDays: 12,
  attendancePercentage: 100,

  monthlyAverages: [
    { month: "May", score: 3.2, target: 4.0 },
    { month: "Jun", score: 3.8, target: 4.0 },
    { month: "Jul", score: 4.1, target: 4.0 },
    { month: "Aug", score: 3.9, target: 4.0 },
    { month: "Sep", score: 4.5, target: 5.0 },
    { month: "Oct", score: 4.65, target: 5.0 },
  ],
};

const KPI_BREAKDOWN_DATA = [
  { program: "Client Satisfaction", score: 4.8, target: 5.0 },
  { program: "Project Completion", score: 92, target: 100 },
  { program: "Bug Fix Efficiency", score: 96, target: 100 },
  { program: "Feature Delivery", score: 4.3, target: 5.0 },
  { program: "Team Collaboration", score: 4.1, target: 5.0 },
];

const NOTIFICATIONS = [
  {
    id: 1,
    text: "Quarterly review meeting scheduled for Oct 15.",
    time: "2h ago",
  },
  { id: 2, text: "Project Alpha milestone achieved.", time: "5h ago" },
];

// --- Circular Progress ---
const CircularProgressBar = ({ percentage, color }) => {
  const safePercentage = Math.max(
    0,
    Math.min(100, isNaN(percentage) ? 0 : percentage)
  );
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          strokeWidth="8"
          stroke="#e5e7eb" // Tailwind gray-200
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle */}
        <circle
          strokeWidth="8"
          stroke={color} // ✅ use passed-in raw color
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold text-gray-800">
          {Math.round(safePercentage)}%
        </span>
      </div>
    </div>
  );
};

// --- Quick Stat Card ---
const StatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  iconBg,
  progressPercentage,
  progressColor,
}) => (
  <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg} shadow-md`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          <span className="text-base font-semibold text-indigo-600 ml-1">
            {unit}
          </span>
        </p>
      </div>
    </div>
    {progressPercentage !== undefined && (
      <CircularProgressBar
        percentage={progressPercentage}
        color={progressColor}
      />
    )}
  </div>
);

const ProfileCard = ({ user }) => {
  const router = useRouter();

  const handleArrowClick = () => {
    const loginID = localStorage.getItem("loginID");
    if (loginID) {
      router.push(`/main/UserProfile?userID=${loginID}`);
    } else {
      console.warn("No loginID found in localStorage");
    }
  };

  return (
    <div className="bg-white p-6 h-75 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
      {/* 1. Header: Avatar and Animated Arrow */}
      <div className="flex items-center justify-between w-full mb-6">
        {/* Avatar */}
        <div className="relative p-4 bg-indigo-100 rounded-full inline-flex items-center justify-center shadow-lg">
          <User className="h-8 w-8 text-indigo-600" />
        </div>

        {/* Animated Arrow */}
        <ArrowRight
          className="h-8 w-8 text-indigo-500 cursor-pointer animate-bounce"
          aria-label="View Score Details"
          onClick={handleArrowClick}
        />
      </div>

      {/* 2. Primary Details (Name and Role) */}
      <div className="w-full text-left mb-6">
        {/* Name */}
        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
          {user.name}
        </h2>

        {/* Role with Caption + Icon */}
        <div className="flex items-center gap-2">
          {/* Role Icon */}
          <div className="p-2 bg-purple-100 rounded-full shadow-sm">
            <Briefcase className="h-5 w-5 text-purple-600" />
          </div>

          {/* Role Caption */}
          <div>
            <p className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Contact Info */}
      <div className="w-full pt-4 border-t border-gray-200">
        <div className="flex items-center justify-start text-gray-600 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
          <Mail className="h-5 w-5 mr-3 text-indigo-500 flex-shrink-0" />
          <span className="text-base font-medium truncate">{user.email}</span>
        </div>
      </div>
    </div>
  );
};


// --- Modern Score Summary Card ---
const ScoreSummaryCard = ({ currentScore, maxScore }) => {
  const percentage = (currentScore / maxScore) * 100;

  // --- Dynamic Styling Logic based on currentScore ---
  let sentimentColorClass;
  let sentimentIcon;

  if (currentScore < 1) {
    sentimentColorClass = "text-red-600 bg-red-50";
    sentimentIcon = <Flame className="h-5 w-5 text-red-600" />;
  } else if (currentScore < 2) {
    sentimentColorClass = "text-orange-500 bg-orange-50";
    sentimentIcon = <TrendingUp className="h-5 w-5 text-orange-500" />;
  } else if (currentScore < 3) {
    sentimentColorClass = "text-yellow-500 bg-yellow-50";
    sentimentIcon = <TrendingUp className="h-5 w-5 text-yellow-500" />;
  } else if (currentScore < 4) {
    sentimentColorClass = "text-green-600 bg-green-50";
    sentimentIcon = <CheckCircle className="h-5 w-5 text-green-600" />;
  } else {
    sentimentColorClass = "text-blue-600 bg-blue-50";
    sentimentIcon = <CheckCircle className="h-5 w-5 text-blue-600" />;
  }

  // --- Circular Progress Ring Component ---
  const ProgressRing = ({ radius, stroke, progress }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // ✅ Use same colors for the ring as sentiment
    let strokeColor;
    if (currentScore < 1) strokeColor = "#dc2626"; // red-600
    else if (currentScore < 2) strokeColor = "#f97316"; // orange-500
    else if (currentScore < 3) strokeColor = "#eab308"; // yellow-500
    else if (currentScore < 4) strokeColor = "#16a34a"; // green-600
    else strokeColor = "#2563eb"; // blue-600

    return (
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="#f3f4f6"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="transition-all duration-1000 ease-in-out"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, stroke: strokeColor }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    );
  };

  const R = 60;
  const STROKE = 10;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-3xl">
      {/* Header */}
      <div className="flex items-start justify-between w-full mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={`p-1 rounded-lg ${sentimentColorClass} flex items-center justify-center`}
          >
            {sentimentIcon}
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            Current Month Average
          </h2>
        </div>

        <ArrowRight
          className="h-8 w-8 text-indigo-500 cursor-pointer animate-bounce"
          aria-label="View Score Details"
        />
      </div>

      {/* Progress Ring */}
      <div className="relative h-[120px] w-[120px] mb-6 bg-gray-900 rounded-full shadow-inner">
        <ProgressRing radius={R} stroke={STROKE} progress={percentage} />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white leading-none">
            {Math.round(percentage)}%
          </span>
        </span>
      </div>

      {/* Scores */}
      <div className="flex flex-col items-center w-full">
        <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-none">
          {currentScore.toFixed(2)}
        </p>
        <p className="text-sm font-medium text-gray-500 mt-1">
          of{" "}
          <span className="font-semibold text-gray-600">
            {maxScore.toFixed(0)}
          </span>{" "}
          total
        </p>
      </div>
    </div>
  );
};

// --- Month Performance Chart (Sleeker Pill-Bar Style) ---
const MonthPerformanceChart = ({ monthlyAverages }) => {
  const getPerformanceCategory = (score) => {
    if (score <= 1) return "Poor";
    if (score <= 2) return "Partial";
    if (score <= 3) return "Normal";
    if (score <= 4) return "Good";
    if (score > 4) return "Excellent";
    return "Poor";
  };

  return (
    // P18 Padding simulated with p-8. Using a border for the Glass effect.
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] backdrop-blur-sm">
      {/* Heading: Standard size, black, bold font */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Last 6 Months Average Performance
      </h2>

      <div className="space-y-5">
        {" "}
        {/* Vertical spacing for the list */}
        {monthlyAverages.map((data) => {
          const baseMax = 5.0;
          const barWidth = Math.min(100, (data.score / baseMax) * 100);
          const performance = getPerformanceCategory(data.score);

          let gradientClass;

          // Define colors using clean, slightly muted hues for the pill look
          switch (performance) {
            case "Poor":
              gradientClass = "bg-gradient-to-r from-red-400 to-red-500";
              break;
            case "Partial":
              gradientClass = "bg-gradient-to-r from-amber-400 to-amber-500";
              break;
            case "Normal":
              gradientClass = "bg-gradient-to-r from-yellow-400 to-yellow-500";
              break;
            case "Good":
              gradientClass = "bg-gradient-to-r from-green-400 to-green-500";
              break;
            case "Excellent":
              gradientClass = "bg-gradient-to-r from-blue-400 to-blue-500";
              break;
            default:
              gradientClass = "bg-gray-400";
          }

          return (
            <div key={data.month} className="flex items-center gap-4">
              {/* Month Name */}
              <div className="w-1/5 text-base font-medium text-gray-600">
                {data.month}
              </div>

              {/* Pill-Shaped Progress Bar Container: REDUCED HEIGHT to h-2 */}
              <div className="flex-grow bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300/50">
                <div
                  // Full rounded shape ('rounded-full') and clean gradient fill
                  // Height is also h-2 to match the container
                  className={`h-full rounded-full transition-all duration-700 ease-out ${gradientClass} shadow-md shadow-black/10`}
                  style={{
                    width: `${barWidth}%`,
                  }}
                ></div>
              </div>

              {/* Score Value */}
              <div className="w-[10%] text-lg font-bold text-right text-gray-800">
                {data.score.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- KPI Breakdown (Sleek Bar with Glow Effect) ---
const KpiBreakdownCard = ({ data }) => {
  // Static colors array provided by the user (Index-based bar colors)
  const colors = [
    "bg-blue-500", // Blue
    "bg-green-500", // Green
    "bg-yellow-500", // Yellow
    "bg-red-500", // Red
    "bg-purple-500", // Purple
  ];

  // Custom glow/shadow classes corresponding to the colors above
  const glowShadows = [
    "shadow-blue-500/50",
    "shadow-green-500/50",
    "shadow-yellow-500/50",
    "shadow-red-500/50",
    "shadow-purple-500/50",
  ];

  // Helper function to map performance status to a strong text color
  const getTextColor = (performance) => {
    switch (performance) {
      case "Excellent":
        return "text-green-600";
      case "Great":
        return "text-indigo-600";
      case "Good":
        return "text-blue-600";
      case "Normal":
        return "text-yellow-600";
      case "Needs Improvement":
        return "text-orange-600";
      case "Poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Logic to determine performance based on 5% levels
  const getPerformanceStatus = (score, target) => {
    if (score >= target * 1.1) return "Excellent"; // > 110%
    if (score >= target * 1.05) return "Great"; // > 105%
    if (score >= target) return "Good"; // >= 100%
    if (score >= target * 0.95) return "Normal"; // >= 95%
    if (score >= target * 0.85) return "Needs Improvement"; // >= 85%
    return "Poor"; // < 85%
  };

  return (
    // Card Container: Enhanced shadow/rounding for a premium look
    <div className="bg-white p-5 rounded-3xl h-96 shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-3xl">
      {/* Heading: Clear, separated with a faint line */}
      <h2 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        KPI Breakdown & Status
      </h2>

      {/* Reduced vertical spacing within the list */}
      <div className="space-y-5">
        {data.slice(0, 5).map((item, idx) => {
          const rawPercentage = (item.score / item.target) * 100;
          const barWidth = Math.min(120, rawPercentage);

          const performance = getPerformanceStatus(item.score, item.target);

          // BAR COLOR: Determined by index
          const barColor = colors[idx % colors.length];
          const glowClass = glowShadows[idx % glowShadows.length];
          // TEXT COLOR: Determined by the dynamic performance status
          const textColor = getTextColor(performance);

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center">
                {/* Program Name and Performance Status */}
                <span className="text-sm font-semibold text-gray-700">
                  {item.program}
                </span>
                <span
                  className={`text-sm font-extrabold ${textColor} flex items-center gap-1`}
                >
                  {/* Performance Category Label */}
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {performance
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  {item.score.toFixed(1)}/{item.target}
                </span>
              </div>

              {/* BAR CONTAINER: Reduced height to h-2 for a very sleek look */}
              <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-visible shadow-inner shadow-gray-300/50">
                {/* Target Segment Marker (Height is now h-2 to match the container) */}
                <div
                  className="absolute top-0 h-full w-[2px] bg-white border border-gray-400/50 rounded-sm"
                  style={{ left: "99%", zIndex: 10 }}
                  aria-label="100% Target Line"
                />

                {/* Progress Fill Bar: GLOW effect and full rounding */}
                <div
                  // Height is also h-2 to match the container
                  className={`${barColor} h-2 rounded-full transition-all duration-700 ease-out shadow-lg ${glowClass}`}
                  style={{
                    width: `${Math.min(100, barWidth)}%`,
                  }}
                ></div>

                {/* Overflow Badge */}
                {barWidth > 100 && (
                  <div
                    className={`absolute right-[-10px] top-1/2 -translate-y-1/2 text-xs font-bold text-white px-2 py-0.5 rounded-full ${barColor} shadow-lg`}
                    style={{ zIndex: 15 }}
                  >
                    +{Math.round(barWidth - 100)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Notifications ---
const NotificationCard = ({ notifications }) => (
  // Card Container: Minimal padding, strong shadow for depth
  <div className="bg-white p-4 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-all duration-300 hover:shadow-3xl">
    {/* Header: Title with a Clear Icon */}
    <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-3 border-b pb-3 border-gray-100">
      <BellRing className="h-6 w-6 text-indigo-600" />
      Notifications
    </h2>

    {/* Scrollable Content Area: 
        - h-56 for fixed height.
        - overflow-y-auto for scrolling.
        - Scrollbar appearance is OS/browser-dependent, but we optimize the surrounding area.
    */}
    <div className="space-y-3 h-51 overflow-y-auto pr-1.5">
      {" "}
      {/* Reduced right padding (pr-1.5) to keep scrollbar tight */}
      {notifications.map((note) => (
        <div
          key={note.id}
          // Inner card design: subtle color flash on the left border
          className="flex items-start p-3 rounded-xl transition-all duration-300 bg-gray-50 hover:bg-indigo-50 cursor-pointer border-l-4 border-gray-100 hover:border-indigo-400 group"
        >
          {/* Status Indicator / Time */}
          <div className="flex-shrink-0 pt-0.5 mr-3">
            {/* Use a slight tint for new/unread emphasis */}
            <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:bg-indigo-700 shadow-sm"></div>
          </div>

          {/* Content */}
          <div className="flex-grow">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {note.text}
            </p>
            {/* Time stamp is subtle and clean */}
            <span className="text-xs text-gray-500 mt-0.5 block">
              {note.time}
            </span>
          </div>

          {/* Action Arrow (fades in on hover) */}
          <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all ml-2" />
        </div>
      ))}
    </div>
  </div>
);
// --- Main Dashboard ---
export default function StaffDashboard() {
  const [staffData, setStaffData] = useState(null);

  const attendanceProgress = STATS_DATA.attendancePercentage;
  const scoreProgress = staffData ? (staffData.currentWeekRating / 5) * 100 : 0;

  let scoreColor = "#d1d5db"; // default gray-300

  if (staffData) {
    if (staffData.currentWeekRating < 2) {
      scoreColor = "#dc2626"; // Tailwind red-600
    } else if (staffData.currentWeekRating < 3) {
      scoreColor = "#f97316"; // Tailwind orange-500
    } else if (staffData.currentWeekRating < 4) {
      scoreColor = "#eab308"; // Tailwind yellow-500
    } else if (staffData.currentWeekRating < 4.5) {
      scoreColor = "#16a34a"; // Tailwind green-600
    } else {
      scoreColor = "#2563eb"; // Tailwind blue-600
    }
  }

  useEffect(() => {
    const loginId = localStorage.getItem("loginID");
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    fetch(
      `/api/weeklyevaluation/staffdashboard?userId=${loginId}&year=${year}&month=${month}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("📊 Staff Dashboard Data:", data);
        setStaffData(data);
      })
      .catch((err) => console.error("❌ API call failed:", err));
  }, []);

  if (!staffData) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-4 font-['Inter']">
      {" "}
      {/* Reduced top/bottom padding */}
      <div className="w-full px-3 sm:px-4 lg:px-6">
        {" "}
        {/* Reduced horizontal padding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {" "}
          
          {/* Column 1: Profile & Stats */}
          <div className="space-y-4 flex flex-col">
            {" "}
            {/* Reduced spacing */}
            <ProfileCard
              user={{
                name: staffData.fullName,
                email: staffData.primaryEmail,
                role: staffData.roleName,
              }}
            />
            <div className="space-y-3">
              <StatCard
                title="Leave Balance"
                value={STATS_DATA.leaveBalance}
                unit="Days Left"
                icon={Calendar}
                iconBg="bg-indigo-500"
                progressPercentage={
                  (STATS_DATA.leaveBalance / STATS_DATA.totalLeaveDays) * 100
                }
                progressColor="#16a34a"
              />
              <StatCard
                title="Monthly Attendance"
                value={STATS_DATA.attendancePercentage}
                unit="%"
                icon={CheckCircle}
                iconBg="bg-teal-500"
                progressPercentage={attendanceProgress}
                progressColor="#16a34a"
              />
              <StatCard
                title={`Week ${staffData.currentWeekNumber} Score Rating`}
                value={staffData.currentWeekRating.toFixed(2)}
                unit="/5"
                icon={TrendingUp}
                iconBg="bg-orange-500"
                progressPercentage={Math.round(scoreProgress)}
                progressColor={scoreColor} // ✅ pass raw color value
              />
            </div>
          </div>

          {/* Column 2: Score & Performance */}
          <div className="space-y-4 flex flex-col">
            {" "}    
            <ScoreSummaryCard
              currentScore={staffData.currentMonthAvg}
              maxScore={5}
            />
            <MonthPerformanceChart
              monthlyAverages={STATS_DATA.monthlyAverages}
              className="flex-grow"
            />
          </div>
          
          {/* Column 3: KPI Breakdown */}
          <div className="space-y-4 flex flex-col">
            {" "}
            {/* Reduced spacing */}
            <NotificationCard notifications={NOTIFICATIONS} />
            <KpiBreakdownCard data={KPI_BREAKDOWN_DATA} />
          </div>
        </div>
        {/* Footer */}
        <footer className="text-center text-xs text-gray-500 mt-6 pt-3 border-t border-gray-200">
          Evaluation data current as of{" "}
          {new Date().toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
          .
        </footer>
      </div>
    </div>
  );
}
