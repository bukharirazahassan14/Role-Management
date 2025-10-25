"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Briefcase,
  User,
  Clock,
  Calendar,
  Shield,
  Tag,
  UserCheck,
  FileText,
  Paperclip,
  Star,
  TrendingUp,
} from "lucide-react";

import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, // Needed for Doughnut
  Tooltip,
  Legend,
  Title,
  CategoryScale, // Needed for Bar
  LinearScale, // Needed for Bar
  BarElement, // Needed for Bar
} from "chart.js";

// ✅ Register ALL chart types used in this file
ChartJS.register(
  ArcElement, // For Doughnut chart
  Tooltip,
  Legend,
  Title,
  CategoryScale, // For Bar chart X axis
  LinearScale, // For Bar chart Y axis
  BarElement // For rendering bars
);
const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCE",
  "#A3B18A",
  "#588157",
  "#38A3A5",
  "#7678ED",
  "#F79F79",
];

// --- Helper to parse JWT ---
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

// --- MonthlyRatingPieChart Component ---
const MonthlyRatingPieChart = ({ monthlyRatings = [], selectedYear }) => {
  // ✅ Chart data
  const data = useMemo(
    () => ({
      labels: monthlyRatings.map((m) => m.month),
      datasets: [
        {
          data: Array(monthlyRatings.length).fill(1), // all slices same size
          backgroundColor: COLORS,
          hoverBackgroundColor: COLORS.map((c) => c + "AA"),
          borderWidth: 1,
        },
      ],
    }),
    [monthlyRatings]
  );

  // ✅ Tooltip
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 30, // adds padding around the pie
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const month = monthlyRatings[ctx.dataIndex]?.month ?? "";
            const rating = monthlyRatings[ctx.dataIndex]?.rating ?? 0;
            // Always format rating to two decimal places
            return `${month}: ${rating.toFixed(2)}`;
          },
        },
      },
    },
    cutout: "60%", // increase cutout for smaller pie
  };

  // ✅ Slice labels
  const sliceLabelPlugin = useMemo(
    () => ({
      id: "sliceLabelPlugin",
      afterDraw(chart) {
        if (!monthlyRatings?.length) return;

        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        if (!meta?.data) return;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        meta.data.forEach((arc, i) => {
          const rating = monthlyRatings[i]?.rating ?? 0;
          const monthLabel = monthlyRatings[i]?.month || "";
          const angle = (arc.startAngle + arc.endAngle) / 2;

          // --- Draw rating inside slice
          const innerRadius =
            arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.45; // move closer to center
          const innerX = arc.x + Math.cos(angle) * innerRadius;
          const innerY = arc.y + Math.sin(angle) * innerRadius;

          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = "#000";
          ctx.fillText(rating.toFixed(2), innerX, innerY + 1); // slight y-shift for centering

          // --- Draw month label closer to the slice to avoid clipping
          const outerRadius = arc.outerRadius + 15; // increased distance for labels
          const outerX = arc.x + Math.cos(angle) * outerRadius;
          const outerY = arc.y + Math.sin(angle) * outerRadius;

          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#4B5563"; // gray text
          ctx.fillText(monthLabel, outerX, outerY);
        });

        ctx.restore();
      },
    }),
    [monthlyRatings]
  );

  // ✅ Center year text
  const centerTextPlugin = useMemo(
    () => ({
      id: "centerTextPlugin",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        const centerX = chartArea.left + chartArea.width / 2;
        const centerY = chartArea.top + chartArea.height / 2;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "600 24px Inter, sans-serif";
        ctx.fillStyle = "#4F46E5";
        ctx.fillText(String(selectedYear), centerX, centerY);
        ctx.restore();
      },
    }),
    [selectedYear]
  );

  // ✅ Add key to force re-render on data or year change
  return (
    <Doughnut
      key={selectedYear + monthlyRatings.map((r) => r.rating).join(",")}
      data={data}
      options={options}
      plugins={[sliceLabelPlugin, centerTextPlugin]}
    />
  );
};

// --- UserProfile Page ---
const availableYears = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

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

export default function UserProfile({ searchParams }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyRatings, setMonthlyRatings] = useState([]);
  const [incrementState, setIncrementState] = useState(0);

  // ✅ Calculate Yearly Average Rating including all 12 months
  const yearAvgRating = useMemo(() => {

    console.log('monthlyRatings>>>>>>>>',monthlyRatings);

    if (!monthlyRatings || monthlyRatings.length === 0) return 0;

    // Always calculate for all 12 months
    const total = monthlyRatings.reduce((sum, m) => sum + (m.rating || 0), 0);
    return (total / 12).toFixed(2);
  }, [monthlyRatings]);

  // --- Fetch monthly ratings from API ---
  const fetchMonthlyRatings = useCallback(async (userID, year) => {
    if (!userID) return;
    try {
      const res = await fetch(
        `/api/weeklyevaluation/monthlyRatingAvg?userId=${userID}&year=${year}`
      );
      if (!res.ok) {
        setMonthlyRatings([]);
        return;
      }
      const apiData = await res.json();

      // console.log("apiData>>>", apiData); // Keep for debugging if needed

      // Ensure 12 months
      const monthNames = [
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
      const filledData = monthNames.map((m) => {
        const found = apiData.find((d) => d.month === m);
        // Ensure rating is treated as a number, defaulting to 0
        return { month: m, rating: found?.rating ? Number(found.rating) : 0 };
      });

      setMonthlyRatings(filledData);
      console.log('filledData',filledData);
 
    } catch {
      setMonthlyRatings([]);
    }
  }, []);

  // --- Fetch user & files ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    const userID = searchParams?.userID || payload.userId;

    async function fetchData() {
      try {
        const [userRes, filesRes] = await Promise.all([
          fetch(`/api/users/profile?userID=${userID}`),
          fetch(`/api/files?userId=${userID}`),
        ]);

        const userData = await userRes.json();
        const filesData = await filesRes.json();

        setUser(userData);
        setFiles(filesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, searchParams]);

  // ✅ Fetch ratings when user or year changes
  useEffect(() => {
    if (user) fetchMonthlyRatings(user._id, selectedYear);
  }, [user, selectedYear, fetchMonthlyRatings]);

  // ✅ Compute total eligible increment based on each month's rating
useEffect(() => {
  if (!monthlyRatings || monthlyRatings.length === 0) {
    setIncrementState(0);
    return;
  }

  const getIncrementValue = (rating) => {
    if (rating <= 1) return 0;
    if (rating <= 2) return 0.5;
    if (rating <= 3) return 1;
    if (rating <= 4) return 1.5;
    if (rating <= 5) return 2;
    return 0;
  };

  let totalIncrement = 0;

  monthlyRatings.forEach((m) => {
    if (m.rating > 0) {
      totalIncrement += getIncrementValue(m.rating);
    }
  });

  setIncrementState(totalIncrement);
}, [monthlyRatings]);

  if (loading || !user)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-700">
          {loading ? "Loading profile..." : "Profile Not Found"}
        </p>
      </div>
    );

  // --- Info Components ---
  // Updated InfoRow and HorizontalInfoItem for a more structured, modern look

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start space-x-3">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
          {label}
        </h3>
        <p className="text-sm font-semibold text-gray-800 break-words">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  const HorizontalInfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center p-2 rounded-md bg-red-50/50 border border-red-100">
      <Icon className="w-4 h-4 mr-2 flex-shrink-0 text-red-500" />
      <h3 className="text-xs font-medium text-red-600 uppercase tracking-wider mr-2">
        {label}:
      </h3>
      <p className="text-sm font-semibold text-gray-800">{value || "N/A"}</p>
    </div>
  );

  // Custom Rating Card component for the "Year AVG Rating"
  const YearAvgRatingCard = ({ avgRating }) => {
    const ratingValue = parseFloat(avgRating);
    const percentage = (ratingValue / 5) * 100;

    return (
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col justify-between">
        <div className="flex items-center justify-center mb-6 text-center pb-3 border-b border-gray-100">
          {" "}
          {/* Subtle border for separation */}
          <Star className="w-6 h-6 mr-2 text-yellow-500 fill-yellow-400" />
          <h2 className="text-xl font-bold text-gray-800">Year AVG Rating</h2>
        </div>

        {/* Metric Display */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-extrabold text-indigo-600 leading-none">
              {avgRating}
            </span>
            <span className="text-2xl text-gray-500">/ 5.0</span>
          </div>
          <p className="mt-2 text-base text-gray-500 font-medium">
            Performance Score for {selectedYear}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span className="text-indigo-600">{percentage.toFixed(0)}%</span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-md transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

const YearlyIncrementCard = ({ incrementState, selectedYear }) => {
  const eligible = incrementState > 0;

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-center mb-6 text-center pb-3 border-b border-gray-100">
        <TrendingUp
          className={`w-6 h-6 mr-2 ${
            eligible ? "text-green-600" : "text-red-500"
          }`}
        />
        <h2 className="text-xl font-bold text-gray-800">
          Eligible for Increment
        </h2>
      </div>

      {/* Increment Display */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <span
          className={`text-6xl font-extrabold ${
            eligible ? "text-green-600" : "text-red-500"
          }`}
        >
          {eligible ? `${incrementState.toFixed(1)}%` : "NO"}
        </span>
        <p className="mt-2 text-base text-gray-500 font-medium">
          Total Annual Increment based on Monthly Ratings
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Performance Year: {selectedYear}
        </p>
      </div>

      {/* Footer / Status */}
      <div className="mt-6 border-t border-gray-100 pt-3 text-center">
        {eligible ? (
          <p className="text-green-700 font-medium">
            ✅ Eligible for yearly increment
          </p>
        ) : (
          <p className="text-red-600 font-medium">
            ❌ Not eligible for increment
          </p>
        )}
      </div>
    </div>
  );
};




  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 font-sans">
      {/* Top Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
        <div className="flex items-center space-x-6">
          {/* ✅ User Image (with graceful fallback) */}
          <div className="relative">
            <Image
              src={getUserImagePath(user._id)}
              alt={`${user.firstName} ${user.lastName} Avatar`}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-2 text-lg text-gray-600 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-indigo-500" />
              <span className="font-semibold">
                {user.jd || "Desination Not Defined"}
              </span>
            </p>
          </div>
        </div>

        <span
          className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider shadow-md ${
            user.isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {user.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* Middle Info - Grouped and Cleaned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Job Description Card */}
        <div className="bg-white rounded-xl shadow-md p-5 lg:col-span-2 border border-gray-100">
          <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
            {" "}
            {/* Subtle border */}
            <FileText className="w-5 h-5 mr-2 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">Role</h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {user.role?.description || "No rule provided."}
          </p>
        </div>

        {/* Emergency Contact Card */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
            {" "}
            {/* Subtle border */}
            <Tag className="w-5 h-5 mr-2 text-red-500" />
            <h2 className="text-lg font-bold text-gray-800">
              Emergency Contact
            </h2>
          </div>
          <div className="space-y-3">
            <HorizontalInfoItem
              icon={Phone}
              label="Contact No."
              value={user.emergencyContact}
            />
            <HorizontalInfoItem
              icon={User}
              label="Relationship"
              value={user.emergencyRelation}
            />
          </div>
        </div>
      </div>

      {/* Primary Info & Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-100">
            {" "}
            {/* Subtle border */}
            <UserCheck className="w-6 h-6 mr-2 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-800">
              Primary Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow
              icon={Mail}
              label="Primary Email"
              value={user.primaryEmail}
            />
            <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
            <InfoRow icon={Shield} label="CNIC / ID" value={user.cnic} />
            <InfoRow icon={Clock} label="Experience (Years)" value={user.exp} />
            <InfoRow
              icon={User}
              label="Father's Name"
              value={user.fatherName}
            />
            <InfoRow
              icon={Calendar}
              label="Date Joined"
              value={new Date(user.joiningDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-100">
            {" "}
            {/* Subtle border */}
            <Paperclip className="w-6 h-6 mr-2 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-800">Attached Files</h2>
          </div>
          {files.length > 0 ? (
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {" "}
              {/* Added pr-2 for scrollbar spacing */}
              {files.map((file) => (
                <li
                  key={file._id}
                  className="p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex flex-col transition border border-indigo-200"
                >
                  <span className="text-sm font-semibold text-gray-800">
                    {file.title}
                  </span>
                  <p className="text-xs text-gray-500 truncate">
                    {file.description}
                  </p>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-indigo-600 font-medium hover:underline"
                  >
                    View / Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg text-gray-500 text-sm">
              No files attached.
            </div>
          )}
        </div>
      </div>

      {/* Ratings Section - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly AVG Rating Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 relative flex flex-col border border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4 z-10 relative pb-3 border-b border-gray-100">
            {" "}
            {/* Subtle border */}
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Monthly AVG Rating
              </h2>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm bg-gray-50 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-50"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full h-[400px] relative z-0">
            <MonthlyRatingPieChart
              monthlyRatings={monthlyRatings}
              selectedYear={selectedYear}
            />
          </div>
        </div>

        {/* Year AVG Rating Card (Using the new component) */}
        <YearAvgRatingCard avgRating={yearAvgRating} />
        <YearlyIncrementCard incrementState={incrementState} selectedYear={selectedYear} />
      </div>
    </div>
  );
}
