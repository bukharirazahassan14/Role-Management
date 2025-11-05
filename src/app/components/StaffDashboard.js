/**
 * ==============================================================================
 * 🚀 Staff Dashboard Component (Next.js/React)
 * ==============================================================================
 *
 * This file implements the Staff Dashboard page. It features:
 * 1. Data fetching from a local API endpoint on component mount.
 * 2. Three main columns for Profile/Stats, Score/Performance, and KPIs/Notifications.
 * 3. Several sub-components for displaying stylized information (Cards, Charts, Progress Bars).
 * 4. Dynamic styling and routing based on user data.
 */

// --- 1. IMPORTS & HOOKS ---
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- Lucide Icons ---
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
  Bell,
} from "lucide-react";

const Image = ({ src, alt, width, height, className, onError }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={className}
    onError={onError}
    style={{ objectFit: "cover" }}
  />
);

// --- Image Helpers (Required Constants and Functions) ---
const DEFAULT_AVATAR = "/avatar.png";

const getUserImagePath = (userId) => {
  return `/uploads/profiles/${userId}.png`;
};

const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = DEFAULT_AVATAR;
};

// --- 2. MOCK & STATIC DATA ---
const STATS_DATA = {
  leaveBalance: 12,
  totalLeaveDays: 12,
  attendancePercentage: 100,
};

const NOTIFICATIONS = [
  // Example data — leave this empty `[]` to test the empty state
  // { id: 1, text: "Quarterly review meeting scheduled for Oct 15.", time: "2h ago" },
  // { id: 2, text: "Project Alpha milestone achieved.", time: "5h ago" },
];

// --- 3. UI COMPONENTS (Shared) ---

// --- Circular Progress Bar Component (Reused for StatCards) ---
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

// --- Quick Stat Card Component ---
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

// --- 4. DASHBOARD SECTION CARDS ---

// --- User Profile Card Component ---
const ProfileCard = ({ user }) => {
  const router = useRouter();
  const [loginID, setLoginID] = useState(null);

  useEffect(() => {
    const storedID = localStorage.getItem("loginID");
    if (storedID) {
      setLoginID(storedID);
    }
  }, []);

  const handleArrowClick = () => {
    if (loginID) {
      router.push(`/main/UserProfile?userID=${loginID}`);
    } else {
      console.warn("No loginID found in localStorage");
    }
  };

  return (
    <div className="bg-white p-4 h-80 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
      {/* 1. Header: Avatar and Animated Arrow */}
      <div className="flex items-center justify-between w-full mb-6">
        {/* Avatar */}
        <div className="relative">
          {loginID ? (
            <Image
              src={getUserImagePath(loginID)}
              alt="Profile Image"
              width={90}
              height={90}
              className="rounded-full border-4 border-indigo-200 shadow-inner"
              onError={handleImageError}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-10 w-10 text-indigo-600" />
            </div>
          )}
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
          <div className="p-2 bg-purple-100 rounded-full shadow-sm">
            <Briefcase className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            {user.jd}
          </p>
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

// --- Modern Score Summary Card (Circular Ring) ---
const ScoreSummaryCard = ({ currentScore, maxScore, performance }) => {
  const router = useRouter();
  const loginID = localStorage.getItem("loginID");
  const percentage = (currentScore / maxScore) * 100;

  // --- Dynamic Styling Logic ---
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

  // --- Match ring color to your provided palette ---
  const getColorByScore = (score) => {
    if (score < 1) return "#dc2626"; // red
    if (score < 2) return "#f97316"; // orange
    if (score < 3) return "#eab308"; // yellow
    if (score < 4) return "#16a34a"; // green
    return "#2563eb"; // blue
  };

  const ringColor = getColorByScore(currentScore);

  // --- Circular Progress Ring Sub-Component ---
  const ProgressRing = ({ radius, stroke, progress }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

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
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, stroke: ringColor }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    );
  };

  // --- Click Handler for Navigation ---
  const handleViewEvaluation = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const queryParams = new URLSearchParams({
      userId: loginID,
      year,
      month,
      weekNumber: 1,
    }).toString();

    router.push(`/main/WeeklyEvaluationViewEdit?${queryParams}`);
  };

  // --- Circle Config ---
  const R = 60;
  const STROKE = 10;

  return (
    <div className="bg-white p-10 h-80 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-3xl">
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
          onClick={handleViewEvaluation}
          className="h-8 w-8 text-indigo-500 cursor-pointer animate-bounce"
          aria-label="View Score Details"
        />
      </div>

      {/* Progress Ring */}
      <div className="relative h-[120px] w-[120px] mb-6 bg-gray-900 rounded-full shadow-inner">
        <ProgressRing radius={R} stroke={STROKE} progress={percentage} />
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white leading-none">
            {currentScore.toFixed(2)}
          </span>
          {/* ✅ Performance label */}
          <span
            className="text-xs font-semibold mt-1"
            style={{ color: ringColor }}
          ></span>
        </span>
      </div>

      {/* Scores */}
      <div className="flex flex-col items-center w-full">
        <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-none">
          {performance}
        </p>
      </div>
    </div>
  );
};

// --- Month Performance Chart (Sleeker Pill-Bar Style) ---
const MonthPerformanceChart = ({ monthlyAverages }) => {
  const getMonthLabel = (month, year) => {
    const date = new Date();
    date.setMonth(month - 1);
    const shortMonth = date.toLocaleString("default", { month: "short" });
    const shortYear = year.toString().slice(-2);
    return `${shortMonth} '${shortYear}`; // e.g., Oct '25
  };

  // --- Color logic reused ---
  const getColorByScore = (score) => {
    if (score < 1) return "#dc2626"; // red-600
    if (score < 2) return "#f97316"; // orange-500
    if (score < 3) return "#eab308"; // yellow-500
    if (score < 4) return "#16a34a"; // green-600
    return "#2563eb"; // blue-600
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] backdrop-blur-sm relative overflow-hidden">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
        <span>Last 6 Months Average Performance</span>
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          (Scale: 0 - 5)
        </span>
      </h2>

      {!monthlyAverages || monthlyAverages.length === 0 ? (
        <p className="text-gray-500 text-sm">No performance data available.</p>
      ) : (
        <div className="space-y-5">
          {monthlyAverages.map((data, index) => {
            const baseMax = 5.0;
            const score = data.avgRating || 0;
            const barWidth = Math.min(100, (score / baseMax) * 100);
            const barColor = score === 0 ? "#d1d5db" : getColorByScore(score);

            return (
              <div
                key={index}
                className="flex items-center gap-4 group hover:scale-[1.01] transition-all duration-300"
              >
                {/* Month + Year Label */}
                <div className="w-1/5 text-base font-semibold text-gray-700 group-hover:text-gray-900 transition">
                  {getMonthLabel(data.month, data.year)}
                </div>

                {/* Performance Bar */}
                {/* 💡 CHANGE: Reduced bar height from h-3 to h-2 */}
                <div className="flex-grow bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300/40 relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-md shadow-black/10"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    }}
                  ></div>
                </div>

                {/* Numeric Score */}
                <div className="w-[12%] text-lg font-bold text-right text-gray-800">
                  {score.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- KPI Color Helper Function (Based on Achieved/Target Ratio) ---
const getColorByScore = (achieved, target) => {
  if (target === 0) return "#d1d5db"; // grey
  const ratio = achieved / target; // normalized ratio 0-1
  if (ratio <= 0.2) return "#dc2626"; // red
  if (ratio <= 0.4) return "#f97316"; // orange
  if (ratio <= 0.6) return "#eab308"; // yellow
  if (ratio <= 0.8) return "#16a34a"; // green
  return "#2563eb"; // blue
};

// --- KPI Breakdown Card (Progress Bars) ---

const KpiBreakdownCard = ({ data, staffData }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 h-96 flex items-center justify-center text-gray-500">
        No KPI data available
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-3xl h-96 shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-3xl">
      <h2 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        {/* Week {staffData?.currentWeekNumber ?? "N/A"} KPI Insights */}
        Key performance indicators (KPIs)
      </h2>

      <div className="space-y-5">
        {data.slice(0, 5).map((item, idx) => {
          const score = Number(item.achieved || 0);
          const target = Number(item.weightage || 0);
          const percentage = target ? (score / target) * 100 : 0;
          const barColor = getColorByScore(score, target);

          // Determine performance text
          let performance = "";
          const ratio = score / target;
          if (ratio <= 0.2) performance = "Poor";
          else if (ratio <= 0.4) performance = "Partial";
          else if (ratio <= 0.6) performance = "Normal";
          else if (ratio <= 0.8) performance = "Good";
          else performance = "Excellent";

          return (
            <div key={idx} className="space-y-1.5">
              {/* KPI Name + Target % + Achieved % + Performance inline */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {item.kpiName || item.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    {target}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-gray-800">
                    {score}%
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: barColor }}
                  >
                    {/* {performance} */}
                  </span>
                </div>
              </div>

              {/* Slim Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden shadow-inner shadow-gray-300/50">
                <div
                  className="h-2 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, percentage)}%`,
                    backgroundColor: barColor,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Notifications Card Component ---
const NotificationCard = ({ notifications }) => (
  <div className="bg-white p-4 h-80 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-all duration-300 hover:shadow-3xl">
    {/* Header */}
    <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-3 border-b pb-3 border-gray-100">
      <BellRing className="h-6 w-6 text-indigo-600" />
      Notifications
    </h2>

    {/* Scrollable area */}
    <div className="space-y-3 h-51 overflow-y-auto pr-1.5">
      {notifications.length > 0 ? (
        notifications.map((note) => (
          <div
            key={note.id}
            className="flex items-start p-3 rounded-xl transition-all duration-300 bg-gray-50 hover:bg-indigo-50 cursor-pointer border-l-4 border-gray-100 hover:border-indigo-400 group"
          >
            <div className="flex-shrink-0 pt-0.5 mr-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:bg-indigo-700 shadow-sm"></div>
            </div>

            <div className="flex-grow">
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {note.text}
              </p>
              <span className="text-xs text-gray-500 mt-0.5 block">
                {note.time}
              </span>
            </div>

            <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all ml-2" />
          </div>
        ))
      ) : (
        // --- Empty State Message ---
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-indigo-200">
          <Bell className="h-10 w-10 mb-2 text-indigo-300" />
          <p className="text-sm font-medium text-gray-600">
            You’re all caught up — no new notifications.
          </p>
        </div>
      )}
    </div>
  </div>
);

// --- 5. MAIN STAFF DASHBOARD COMPONENT ---
export default function StaffDashboard() {
  const [staffData, setStaffData] = useState(null);

  // --- Derived State and Dynamic Styling Logic ---
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

  // --- Data Fetching Effect (API Call) ---
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
        setStaffData(data);
      })
      .catch((err) => console.error("❌ API call failed:", err));
  }, []);

  // --- Loading State Render ---
  if (!staffData) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // --- Main Dashboard Layout Render ---
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
            <ProfileCard
              user={{
                name: staffData.fullName,
                email: staffData.primaryEmail,
                role: staffData.roleDesc,
                jd: staffData.jd,
              }}
            />
            {/* Stats */}
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
                title={`Current Week Score Rating`}
                value={(staffData?.currentWeekRating ?? 0).toFixed(2)}
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
              performance={staffData.performance}
            />
            <MonthPerformanceChart
              monthlyAverages={staffData.lastSixMonths}
              className="flex-grow"
            />
          </div>
          {/* Column 3: KPI Breakdown and Notifications */}
          <div className="space-y-4 flex flex-col">
            {" "}
            {/* Reduced spacing */}
            <NotificationCard notifications={NOTIFICATIONS} />
            <KpiBreakdownCard
              data={staffData.scoringRates || []}
              staffData={staffData}
            />
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
