"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- FAKE DATA FOR CHART ---
const FAKE_MONTHLY_RATINGS = [
  { month: "Jan", rating: 4.2 },
  { month: "Feb", rating: 4.5 },
  { month: "Mar", rating: 4.0 },
  { month: "Apr", rating: 4.7 },
  { month: "May", rating: 4.3 },
  { month: "Jun", rating: 4.6 },
  { month: "Jul", rating: 4.1 },
  { month: "Aug", rating: 4.4 },
  { month: "Sep", rating: 4.8 },
  { month: "Oct", rating: 4.9 },
  { month: "Nov", rating: 4.2 },
  { month: "Dec", rating: 4.5 },
];

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

// --- JWT parse helper (kept as-is) ---
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

// ----------------- MONTHLY PIE CHART -----------------
const MonthlyRatingPieChart = () => {
  const data = useMemo(
    () => ({
      labels: FAKE_MONTHLY_RATINGS.map(item => item.month),
      datasets: [
        {
          data: FAKE_MONTHLY_RATINGS.map(item => item.rating),
          backgroundColor: COLORS,
          hoverBackgroundColor: COLORS.map(c => c + "AA"),
          borderWidth: 1,
        },
      ],
    }),
    []
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",          // 🔹 make pie smaller
    layout: { padding: 60 }, // 🔹 add breathing space for labels
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => {
            const month = context.label || "";
            const rating =
              FAKE_MONTHLY_RATINGS[context.dataIndex].rating.toFixed(1);
            return `${month}: ${rating}`;
          },
        },
      },
    },
  };

  // 🔹 Average rating inside each slice
  const sliceLabelPlugin = {
    id: "ratingValueInSlice",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;

      const centerX = chartArea.left + chartArea.width / 2;
      const centerY = chartArea.top + chartArea.height / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#000";

      meta.data.forEach((arc, i) => {
        const angle = (arc.startAngle + arc.endAngle) / 2;
        const radius = (arc.innerRadius + arc.outerRadius) / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.fillText(FAKE_MONTHLY_RATINGS[i].rating.toFixed(1), x, y);
      });

      ctx.restore();
    },
  };

  // 🔹 Month names around the pie
  const monthLabelPlugin = {
    id: "monthLabelsAroundPie",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;

      const labels = chart.data.labels || [];
      const centerX = chartArea.left + chartArea.width / 2;
      const centerY = chartArea.top + chartArea.height / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillStyle = "#374151";

      meta.data.forEach((arc, i) => {
        const angle = (arc.startAngle + arc.endAngle) / 2;
        const maxRadius = Math.min(chartArea.width, chartArea.height) / 2;
        const labelRadius = Math.max(arc.outerRadius * 1.05, maxRadius * 0.8);

        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;

        ctx.fillText(labels[i], x, y);
      });

      ctx.restore();
    },
  };

  // 🔹 Year at center
  const centerYearPlugin = {
    id: "centerYear",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const centerX = chartArea.left + chartArea.width / 2;
      const centerY = chartArea.top + chartArea.height / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 22px Inter, sans-serif";
      ctx.fillStyle = "#4F46E5";
      ctx.fillText("2025", centerX, centerY);
      ctx.restore();
    },
  };

  return (
    <div className="relative w-full h-[420px]">
      <Doughnut
        data={data}
        options={options}
        plugins={[sliceLabelPlugin, monthLabelPlugin, centerYearPlugin]}
      />
    </div>
  );
};
// ----------------------------------------------------

const availableYears = [2023, 2024, 2025, 2026]; // You can fetch this from API

export default function UserProfile({ searchParams }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(2025); // Default year
  const yearAvgRating = "4.8";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
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

        if (!userRes.ok || !filesRes.ok)
          throw new Error("Failed to fetch data");

        const userData = await userRes.json();
        const filesData = await filesRes.json();

        setUser(userData);
        setFiles(filesData);
      } catch (error) {
        console.error("❌ Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, searchParams]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-700">
          {loading ? "Loading profile..." : "Profile Not Found"}
        </p>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mb-1">
        <Icon className="w-4 h-4 mr-2 text-gray-400" />
        {label}
      </h3>
      <p className="text-base font-semibold text-gray-800 break-words">
        {value || "N/A"}
      </p>
    </div>
  );

  const HorizontalInfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center space-x-2">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
        <Icon className="w-4 h-4 mr-1 text-gray-400" />
        {label}:
      </h3>
      <p className="text-sm font-semibold text-gray-800">{value || "N/A"}</p>
    </div>
  );

  const RatingColumn = ({ title, content }) => (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center text-center h-full">
      <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center mb-2">
        <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-400" />
        {title}
      </h2>
      {content}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Top */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-4xl font-bold shadow">
            {user.firstName?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-base text-gray-600 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-gray-500" />
              {user.role?.name || "Role Not Defined"}
            </p>
          </div>
        </div>

        <span
          className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow ${
            user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {user.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* Middle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-3">
            <FileText className="w-5 h-5 mr-2 text-indigo-500" />
            Job Description
          </h2>
          <p className="text-gray-700 text-sm">
            {user.jd || "No job description provided."}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-3">
            <Tag className="w-5 h-5 mr-2 text-red-500" />
            Emergency Contact
          </h2>
          <div className="space-y-2">
            <HorizontalInfoItem
              icon={Phone}
              label="Contact No."
              value={user.emergencyContact}
            />
            <HorizontalInfoItem icon={User} label="Relationship" value={user.emergencyRelation} />
          </div>
        </div>
      </div>

      {/* Primary Info & Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4">
            <UserCheck className="w-5 h-5 mr-2 text-indigo-500" />
            Primary Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Primary Email" value={user.primaryEmail} />
              <InfoRow icon={Shield} label="CNIC / ID" value={user.cnic} />
              <InfoRow icon={User} label="Father's Name" value={user.fatherName} />
            </div>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
              <InfoRow icon={Clock} label="Experience (Years)" value={user.exp} />
              <InfoRow icon={Calendar} label="Date Joined" value={new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4">
            <Paperclip className="w-5 h-5 mr-2 text-indigo-500" />
            Attached Files
          </h2>
          {files.length > 0 ? (
            <ul className="space-y-3">
              {files.map((file) => (
                <li key={file._id} className="p-3 rounded-lg bg-gray-50 flex flex-col shadow-sm hover:shadow-md transition">
                  <span className="text-sm font-semibold text-gray-800">{file.title}</span>
                  <p className="text-xs text-gray-500">{file.description}</p>
                  <a href={file.fileUrl} target="_blank" className="mt-1 text-xs text-indigo-600 hover:underline">View / Download</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No files attached.</p>
          )}
        </div>
      </div>

    {/* Ratings */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* LEFT SIDE */}
  <div className="bg-white rounded-xl shadow-md p-6 relative flex flex-col justify-center">
    {/* Title + Dropdown */}
    <div className="flex items-center gap-4 mb-4 z-10 relative">
      <h2 className="text-lg font-bold text-gray-800">Monthly AVG Rating</h2>

      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="
          border border-gray-300
          rounded-lg px-3 py-1.5
          text-sm font-medium text-gray-700
          shadow-sm bg-white
          cursor-pointer
          hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          z-50
        "
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>

    {/* Chart */}
    <div className="w-full h-[380px] relative z-0">
      <MonthlyRatingPieChart selectedYear={selectedYear} />
    </div>
  </div>

  {/* RIGHT SIDE */}
  <RatingColumn
    title="Year AVG Rating"
    content={
      <p className="text-4xl font-extrabold text-indigo-600">
        {yearAvgRating}
        <span className="text-base font-normal text-gray-600"> / 5.0</span>
      </p>
    }
  />
</div>

    </div>
  );
}
