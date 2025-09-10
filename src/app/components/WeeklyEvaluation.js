"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Glasses,
  Plus,
  Edit,
  List,
  LayoutGrid,
  FileText,
  User,
  Calendar,
  Star,
  Trophy,
  Award,
  Eye,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import useIsMobile from "../hooks/useIsMobile";

export default function EmployeeWeeklyEvaluation() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const didFetch = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [viewMode, setViewMode] = useState("list");
  const isMobile = useIsMobile();

  // 🔑 decode JWT
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

  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Auto set current month start and end when enabling date filter
  useEffect(() => {
    if (showDateFilter) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);
    }
  }, [showDateFilter]);


  // ✅ Token validation
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (!payload || payload.exp < now) {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  // ✅ Fetch weekly evaluations
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    async function fetchEvaluations() {
      try {
        const role = localStorage.getItem("userRole");
        setCurrentUserRole(role);

        const res = await fetch("/api/weeklyevaluation");
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvaluations(data);
        }
      } catch (err) {
        console.error("Failed to fetch evaluations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvaluations();
  }, []);

  if (loading) return <div className="p-8">Loading evaluations...</div>;
  if (!evaluations.length)
    return <div className="p-8">No evaluations found.</div>;

  // 🔍 Search + Date Filter
const filtered = evaluations.filter((ev) => {
  const query = searchQuery.toLowerCase();

  // 🔎 Text-based search
  const matchesText =
    ev.userId?.fullName?.toLowerCase().includes(query) ||
    ev.userId?.primaryEmail?.toLowerCase().includes(query) ||
    ev.weekNumber?.toString().includes(query);

  // 📅 Date filtering
  const evStart = ev.weekStart ? new Date(ev.weekStart) : null;
  const evEnd = ev.weekEnd ? new Date(ev.weekEnd) : null;

  const filterStart = startDate ? new Date(startDate) : null;
  const filterEnd = endDate ? new Date(endDate) : null;

  // Include by default
  let matchesDate = true;

  if (filterStart && evEnd) {
    matchesDate = matchesDate && evEnd >= filterStart;
  }

  if (filterEnd && evStart) {
    matchesDate = matchesDate && evStart <= filterEnd;
  }

  return matchesText && matchesDate;
});


  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-8 w-full">
      {/* ✅ Toast */}
      {message && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`px-4 py-2 rounded shadow-lg text-white ${
              success ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message}
          </div>
        </div>
      )}

      {/* 🔍 Search & Toggle */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center justify-end flex-1 ml-4">
          <div className="flex items-center w-full max-w-md">
            {/* Calendar Toggle Button */}
            <button
              onClick={() => setShowDateFilter((prev) => !prev)}
              className={`p-3 rounded-lg border bg-white shadow-sm transition ${
                showDateFilter
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Filter by Date"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Conditional: Date Filter OR Search */}
            {showDateFilter ? (
              <div className="flex items-center gap-2 ml-2 w-full">
                {/* Start Date */}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                  bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 
                  focus:border-indigo-500 text-sm transition"
                />

                <ArrowRight className="w-5 h-5 text-gray-500" />

                {/* End Date */}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg 
                  bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 
                  focus:border-indigo-500 text-sm transition"
                />
              </div>
            ) : (
              <div className="relative flex-1 ml-2">
                <input
                  type="text"
                  placeholder="Search by name, email, or week number (1,2..)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg 
                  bg-white shadow-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                  text-base placeholder-gray-400 transition"
                />
                <Glasses className="absolute left-3 top-2.5 w-7 h-7 text-blue-500" />
              </div>
            )}
          </div>

          {/* Toggle Buttons (hidden on mobile) */}
          {!isMobile && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg border transition ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>

              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg border transition ${
                  viewMode === "card"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Table view */}
      {viewMode === "list" && !isMobile ? (
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
          <table className="w-full table-fixed text-left">
            <thead className="bg-indigo-900 text-white">
              <tr>
                {/* Add Button Column */}
                <th className="px-4 py-3 w-1/8 text-center">
                  {(currentUserRole === "Super Admin" ||
                    currentUserRole === "HR" ||
                    currentUserRole === "Management") && (
                    <button className="bg-white text-indigo-900 rounded-full p-2 shadow hover:bg-gray-100 transition">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </th>
                <th className="px-4 py-3 w-1/8">Name</th>
                <th className="px-4 py-3 w-1/8">Week</th>
                <th className="px-4 py-3 w-1/8">Start Date</th>
                <th className="px-4 py-3 w-1/8">End Date</th>
                <th className="px-4 py-3 w-1/8">Total Score</th>
                <th className="px-4 py-3 w-1/8">Weighted Rating</th>
                <th className="px-4 py-3 w-1/8">Performance</th>
                {/* New column */}
              </tr>
            </thead>

            <tbody>
              {current.map((ev) => {
                let performance = "N/A";
                let colorClass = "text-gray-500 font-medium";

                if (ev.totalWeightedRating <= 1) {
                  performance = "Poor";
                  colorClass = "text-red-600 font-semibold";
                } else if (ev.totalWeightedRating <= 2) {
                  performance = "Partial";
                  colorClass = "text-orange-500 font-semibold";
                } else if (ev.totalWeightedRating <= 3) {
                  performance = "Normal";
                  colorClass = "text-yellow-500 font-semibold";
                } else if (ev.totalWeightedRating <= 4) {
                  performance = "Good";
                  colorClass = "text-green-600 font-semibold";
                } else if (ev.totalWeightedRating <= 5) {
                  performance = "Excellent";
                  colorClass = "text-blue-600 font-semibold";
                }

                return (
                  <tr key={ev._id} className="hover:bg-indigo-50 border-b">
                    {/* View & Edit Buttons */}
                    <td className="px-4 py-4 text-center align-middle">
                      <div className="flex justify-center items-center gap-6">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewEvaluation(ev)}
                          className="text-indigo-600 hover:text-indigo-900 transition"
                          title="View Evaluation"
                        >
                          <Glasses className="w-6 h-6" />
                        </button>

                        {/* Edit Button */}
                        {(currentUserRole === "Super Admin" ||
                          currentUserRole === "HR" ||
                          currentUserRole === "Management") && (
                          <button
                            onClick={() => handleEditEvaluation(ev)}
                            className="text-indigo-600 hover:text-indigo-900 transition"
                            title="Edit Evaluation"
                          >
                            <Edit className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Data Columns */}
                    <td className="px-4 py-4 truncate">
                      {ev.userId?.fullName || "N/A"}
                    </td>
                    <td className="px-4 py-4 truncate">Week {ev.weekNumber}</td>
                    <td className="px-4 py-4 truncate">
                      {ev.weekStart
                        ? new Date(ev.weekStart).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-4 truncate">
                      {ev.weekEnd
                        ? new Date(ev.weekEnd).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-4 truncate">{ev.totalScore}</td>
                    <td className="px-4 py-4 truncate">
                      {ev.totalWeightedRating.toFixed(2)}
                    </td>
                    <td className={`px-4 py-4 truncate ${colorClass}`}>
                      {performance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Modern Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {current.map((ev) => {
            // Performance logic
            let performance = "N/A";
            let badgeClass = "bg-gray-200 text-gray-600";

            if (ev.totalWeightedRating <= 1) {
              performance = "Poor";
              badgeClass = "bg-red-200/80 text-red-900";
            } else if (ev.totalWeightedRating <= 2) {
              performance = "Partial";
              badgeClass = "bg-orange-200/80 text-orange-900";
            } else if (ev.totalWeightedRating <= 3) {
              performance = "Normal";
              badgeClass = "bg-yellow-200/80 text-yellow-900";
            } else if (ev.totalWeightedRating <= 4) {
              performance = "Good";
              badgeClass = "bg-green-200/80 text-green-900";
            } else if (ev.totalWeightedRating <= 5) {
              performance = "Excellent";
              badgeClass = "bg-blue-200/80 text-blue-900";
            }

            return (
              <div
                key={ev._id}
                className="relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl transition rounded-2xl p-6 group overflow-hidden"
              >
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {ev.userId?.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 transition">
                      {ev.userId?.fullName || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Week {ev.weekNumber}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  {/* ✅ Dates in one row */}
                  <div className="flex justify-between items-center gap-4">
                    <p className="flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {ev.weekStart
                        ? new Date(ev.weekStart).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </p>

                    {/* Arrow Separator */}
                    <span className="text-gray-500 dark:text-gray-400">→</span>

                    <p className="flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      {ev.weekEnd
                        ? new Date(ev.weekEnd).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  {/* Score */}
                  <p className="flex justify-between items-center">
                    <span className="flex items-center gap-2 font-medium">
                      <Star className="w-4 h-4 text-yellow-500" /> Score
                    </span>
                    <span className="font-medium text-indigo-700 dark:text-indigo-400">
                      {ev.totalScore}
                    </span>
                  </p>

                  {/* Weighted */}
                  <p className="flex justify-between items-center">
                    <span className="flex items-center gap-2 font-medium">
                      <TrendingUp className="w-4 h-4 text-green-500" /> Weighted
                    </span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {ev.totalWeightedRating.toFixed(2)}
                    </span>
                  </p>

                  {/* Performance */}
                  <p className="flex justify-between items-center">
                    <span className="flex items-center gap-2 font-medium">
                      <Award className="w-4 h-4 text-pink-500" /> Performance
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
                    >
                      {performance}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleViewEvaluation(ev)}
                    className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
                    title="View"
                  >
                    <Glasses className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditEvaluation(ev)}
                    className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800/50 transition group">
            <Plus className="w-14 h-14 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="mt-4 text-indigo-600 font-medium text-lg">
              Add New Evaluation
            </span>
          </div>
        </div>
      )}

      {/* ✅ Pagination */}
      <div className="flex justify-end items-center mt-4 space-x-4">
        <p className="text-sm text-gray-500">
          Showing {indexOfFirst + 1} - {Math.min(indexOfLast, filtered.length)}{" "}
          of {filtered.length}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx + 1)}
              className={`px-3 py-1 border rounded-md text-sm ${
                currentPage === idx + 1
                  ? "bg-indigo-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
