"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Glasses,
  Plus,
  Edit,
  List,
  LayoutGrid,
  Calendar,
  Star,
  Award,
  Trash2,
  TrendingUp,
  ArrowRight,
  X,
  UserCircle,
  FilePlus,
  SlidersHorizontal,
} from "lucide-react";

import useIsMobile from "../hooks/useIsMobile";
import { useReactToPrint } from "react-to-print";
import Report from "../components/WeeklyEvaluationReport";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [evaluationPrograms, setEvaluationPrograms] = useState([]);
  const [evaluationScores, setEvaluationScores] = useState([]);
  const [comments, setComments] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [takenWeeks, setTakenWeeks] = useState([]);

  const reportRef = useRef(null);

  //Search>>>>>>>>>>>>>>>>>>>>>>>>>
  const [SerSelectedYear, setSerSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [SerSelectedMonth, setSerSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [SerSelectedWeeks, setSerSelectedWeeks] = useState([]); // multiple selectable

  // Years range: current ± 5
  const SerYears = useMemo(() => {
    const SerNow = new Date();
    const SerStart = SerNow.getFullYear() - 5;
    return Array.from({ length: 11 }, (_, SerIndex) => SerStart + SerIndex);
  }, []);

  const SerMonths = [
    { SerValue: 1, SerLabel: "January" },
    { SerValue: 2, SerLabel: "February" },
    { SerValue: 3, SerLabel: "March" },
    { SerValue: 4, SerLabel: "April" },
    { SerValue: 5, SerLabel: "May" },
    { SerValue: 6, SerLabel: "June" },
    { SerValue: 7, SerLabel: "July" },
    { SerValue: 8, SerLabel: "August" },
    { SerValue: 9, SerLabel: "September" },
    { SerValue: 10, SerLabel: "October" },
    { SerValue: 11, SerLabel: "November" },
    { SerValue: 12, SerLabel: "December" },
  ];

  const SerWeeks = [1, 2, 3, 4];

  //search>>>>>>>>>>>>>>>>>>>>>>>>>

  const SerNotifyChange = async (SerYear, SerMonth, SerWeeks) => {
    try {
      let weekParam = undefined;

      if (Array.isArray(SerWeeks)) {
        // if all weeks selected (1,2,3,4) => skip sending week
        const allWeeks = [1, 2, 3, 4];
        const isAllWeeks =
          SerWeeks.length === allWeeks.length &&
          allWeeks.every((w) => SerWeeks.includes(w));

        if (!isAllWeeks) {
          weekParam = SerWeeks.join(","); // only send if not all weeks
        }
      } else if (SerWeeks) {
        weekParam = String(SerWeeks); // single value
      }

      // build query params
      const query = new URLSearchParams({
        year: SerYear,
        month: SerMonth,
        ...(weekParam ? { week: weekParam } : {}), // only include week if needed
      }).toString();

      console.log("query>>>>>>>>>>>>>>>", query);

      const res = await fetch(
        `/api/weeklyevaluation/performance/monthly?${query}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setEvaluations(data);
      } else {
        console.error("Unexpected API response:", data);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef, // 👈 new API
    documentTitle: "Weekly Evaluation Report",
  });

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

  // 🔄 Fetch users when drawer opens
  useEffect(() => {
    if (!drawerOpen) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users/basic"); // replace with your API
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, [drawerOpen]);

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

  const fetchEvaluations = useCallback(async () => {
    try {
      const role = localStorage.getItem("userRole");
      setCurrentUserRole(role);

      const query = new URLSearchParams({
        startDate,
        endDate,
      }).toString();

      const res = await fetch(`/api/weeklyevaluation/performance?${query}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvaluations(data);
      }
    } catch (err) {
      console.error("Failed to fetch evaluations:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // ✅ Initialize date range on first load
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const format = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    setStartDate(format(firstDay));
    setEndDate(format(lastDay));
    setShowDateFilter(false);
  }, []); // run only once

  // ✅ Fetch evaluations when startDate and endDate are ready
  useEffect(() => {
    if (!startDate || !endDate) return; // wait until both dates are set

    const start = new Date(startDate);
    const end = new Date(endDate);

    // ✅ If months don't match, fix endDate to the last day of startDate's month
    if (
      start.getMonth() !== end.getMonth() ||
      start.getFullYear() !== end.getFullYear()
    ) {
      const lastDayOfMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      );

      const format = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;

      setEndDate(format(lastDayOfMonth));
      return; // wait for state update before fetching
    }

    fetchEvaluations();
  }, [startDate, endDate, fetchEvaluations]);

  const fetchEvaluationPrograms = async () => {
    try {
      const res = await fetch("/api/weeklyevaluation/evaluationprograms");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvaluationPrograms(data);

        // Initialize scores state with empty values
        setEvaluationScores(
          data.map(() => ({ score: "", weightedRating: "" }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch evaluation programs:", err);
    }
  };

  // Fetch programs once
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    fetchEvaluationPrograms();
  }, []);

  // Handle score input + calculate weighted rating
  const handleScoreChange = (index, score, weightage, progId) => {
    const newScores = [...evaluationScores];
    const numericScore = parseFloat(score) || 0;
    const weightedRating = ((numericScore * weightage) / 100).toFixed(1);

    newScores[index] = {
      _id: progId,
      score: numericScore,
      weightage,
      weightedRating,
    };
    setEvaluationScores(newScores);
  };

  if (loading) return <div className="p-8">Loading evaluations...</div>;

  const formatDatePKT = (date) => {
    return date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi", // Force PKT
    }); // gives yyyy-mm-dd
  };

  // Always parse yyyy-mm-dd as local PKT date (ignores timezone shift)
  const parseDatePKT = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day); // 👈 no UTC conversion
  };

  // 🔍 Search + Date Filter
  const filtered = evaluations.filter((ev) => {
    const query = searchQuery.toLowerCase();

    // 🔎 Text-based search
    const matchesText =
      ev.userId?.fullName?.toLowerCase().includes(query) ||
      ev.userId?.primaryEmail?.toLowerCase().includes(query) ||
      ev.weekNumber?.toString().includes(query);

    // 📅 Date filtering (PKT-safe) → always active if start/end set
    let matchesDate = true;
    if (startDate || endDate) {
      const evStart = ev.weekStart
        ? parseDatePKT(ev.weekStart.split("T")[0])
        : null;
      const evEnd = ev.weekEnd ? parseDatePKT(ev.weekEnd.split("T")[0]) : null;

      const filterStart = startDate ? parseDatePKT(startDate) : null;
      const filterEnd = endDate ? parseDatePKT(endDate) : null;

      if (filterStart && evEnd)
        matchesDate = matchesDate && evEnd >= filterStart;
      if (filterEnd && evStart)
        matchesDate = matchesDate && evStart <= filterEnd;
    }

    return matchesText && matchesDate;
  });

  const handleAddUser = async (userId) => {
    try {
      const currentDate = new Date(startDate);
      const currentyear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based

      // ✅ Fetch user's evaluation data for this month
      const res = await fetch(
        `/api/weeklyevaluation/performance/${userId}?month=${currentMonth}&year=${currentyear}`
      );
      const data = await res.json();
      const existingWeeks = data?.uniqueWeeks || [];
      const weekCount = data?.weekCount || 0;

      // ✅ If all 4 weeks are already evaluated
      if (weekCount === 4) {
        setMessage(
          "🎉 This month's evaluation has been completed. Congratulations!"
        );
        setSuccess(true);
        setTimeout(() => setMessage(""), 4000); // auto-hide after 4s
        return;
      }

      // ✅ Open drawer and setup
      setDrawerOpen(true);
      fetchEvaluationPrograms();
      setTakenWeeks(existingWeeks);

      // Pick default week (next available)
      const defaultWeek =
        existingWeeks.length > 0 ? Math.max(...existingWeeks) + 1 : 1;
      setSelectedWeek(defaultWeek);

      // ✅ Calculate weekStart and weekEnd based on startDate
      const baseDate = new Date(startDate);
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const totalDays = lastDayOfMonth.getDate();
      const daysPerWeek = Math.ceil(totalDays / 4);

      const start = new Date(year, month, (defaultWeek - 1) * daysPerWeek + 1);
      let end = new Date(year, month, defaultWeek * daysPerWeek);
      if (end > lastDayOfMonth) end = lastDayOfMonth;

      setWeekStart(formatDatePKT(start));
      setWeekEnd(formatDatePKT(end));

      // Save selected user
      setSelectedUserId(userId);
      setEditingEvaluation(null);
      setViewingEvaluation(null);
    } catch (err) {
      console.error("Error fetching user evaluations:", err);
      setMessage("⚠️ Failed to fetch evaluations.");
      setSuccess(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleWeekSelect = async (week) => {
    if (editingEvaluation || viewingEvaluation) {
      // ✅ build query with userId, year, month, week
      const query = new URLSearchParams({
        userId: selectedUserId,
        year: SerSelectedYear,
        month: SerSelectedMonth,
        weekNumber: week,
      }).toString();

      const res = await fetch(
        `/api/weeklyevaluation/${selectedUserId}?${query}`
      );

      if (res.status === 404) {
        console.warn("No evaluation found for this user.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch evaluation");

      const data = await res.json();

      // Pre-fill form fields
      setWeekStart(data.weekStart.split("T")[0]);
      setWeekEnd(data.weekEnd.split("T")[0]);
      setComments(data.comments || "");
      setEvaluationScores(
        data.scores.map((s) => ({
          kpiId: s.kpiId,
          score: s.score,
          weightage: s.weightage,
          weightedRating: s.weightedRating,
        }))
      );
      setSelectedWeek(week);
      setEditingEvaluation(data);
      return;
    }

    setSelectedWeek(week);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const daysPerWeek = Math.ceil(totalDays / 4);

    const start = new Date(year, month, (week - 1) * daysPerWeek + 1);
    let end = new Date(year, month, week * daysPerWeek);
    if (end > lastDay) end = lastDay;

    // ✅ Format with Pakistan Standard Time
    setWeekStart(formatDatePKT(start));
    setWeekEnd(formatDatePKT(end));
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const totalScore = evaluationScores.reduce(
    (sum, s) => sum + Number(s?.score || 0),
    0
  );

  const totalRating = evaluationScores
    .reduce((sum, s) => sum + Number(s?.weightedRating || 0), 0)
    .toFixed(2);

  const handleSubmit = async (payload) => {
    try {
      // ✅ Validate before sending
      if (!payload.userId) {
        setMessage("❌ Please select a user");
        setSuccess(false);
        return;
      }
      if (!payload.weekNumber || !payload.weekStart || !payload.weekEnd) {
        setMessage("❌ Please select week & dates");
        setSuccess(false);
        return;
      }
      if (
        payload.evaluationScores.some((s) => s.score === "" || s.score == null)
      ) {
        setMessage("❌ Please fill all scores before submitting");
        setSuccess(false);
        return;
      }

      // ✅ Switch POST or PUT based on editing state
      const url = editingEvaluation
        ? `/api/weeklyevaluation/${editingEvaluation._id}`
        : `/api/weeklyevaluation`;

      const method = editingEvaluation ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          `❌ Failed to ${editingEvaluation ? "update" : "create"} evaluation`
        );
      }

      const data = await res.json();
      console.log("✅ Saved Evaluation:", data);

      await fetchEvaluations(); // refresh list

      // 🎉 Success feedback
      handleCloseDrawer();
      setMessage(
        `✅ Evaluation ${
          editingEvaluation ? "updated" : "submitted"
        } successfully!`
      );
      setSuccess(true);
    } catch (err) {
      console.error("❌ Error submitting evaluation:", err);
      setMessage("❌ Failed to submit evaluation");
      setSuccess(false);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ✅ Function to handle editing an evaluation
  const handleEditEvaluation = async (userId) => {
    try {
      await fetchEvaluationPrograms();

      // build query string with userId, year, month
      const query = new URLSearchParams({
        userId,
        year: SerSelectedYear,
        month: SerSelectedMonth,
        weekNumber: 1, // ✅ always pass week = 1
      }).toString();

      const res = await fetch(`/api/weeklyevaluation/${userId}?${query}`);
      if (res.status === 404) {
        console.warn("No evaluation found for this user.");
        setDrawerOpen(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch evaluation");

      const data = await res.json();

      // Pre-fill form fields
      setSelectedUserId(data.userId?._id || "");
      setSelectedWeek(data.weekNumber);
      setWeekStart(data.weekStart.split("T")[0]);
      setWeekEnd(data.weekEnd.split("T")[0]);
      setComments(data.comments || "");
      setEvaluationScores(
        data.scores.map((s) => ({
          kpiId: s.kpiId,
          score: s.score,
          weightage: s.weightage,
          weightedRating: s.weightedRating,
        }))
      );

      setEditingEvaluation(data);
      setDrawerOpen(true);
    } catch (error) {
      console.error("Error in handleEditEvaluation:", error);
    }
  };

  // ✅ Function to handle viewing an evaluation (read-only mode)
  const handleViewEvaluation = async (userId) => {
    try {

       const querytest = new URLSearchParams({
      userId,
      year: SerSelectedYear,
      month: SerSelectedMonth,
      weekNumber: 1, // ✅ always pass week = 1
    }).toString();

    // ✅ Navigate with query params
    router.push(`/main/WeeklyEvaluationViewEdit?${querytest}`);
    return

      await fetchEvaluationPrograms();

      // build query string with userId, year, month
      const query = new URLSearchParams({
        userId,
        year: SerSelectedYear,
        month: SerSelectedMonth,
        weekNumber: 1, // ✅ always pass week = 1
      }).toString();

      const res = await fetch(`/api/weeklyevaluation/${userId}?${query}`);
      if (res.status === 404) {
        console.warn("No evaluation found for this user.");
        setDrawerOpen(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch evaluation");

      const data = await res.json();

      // Pre-fill form fields
      setSelectedUserId(data.userId?._id || "");
      setSelectedWeek(data.weekNumber);
      setWeekStart(data.weekStart.split("T")[0]);
      setWeekEnd(data.weekEnd.split("T")[0]);
      setComments(data.comments || "");
      setEvaluationScores(
        data.scores.map((s) => ({
          kpiId: s.kpiId,
          score: s.score,
          weightage: s.weightage,
          weightedRating: s.weightedRating,
        }))
      );

      // Mark as viewing
      setViewingEvaluation(data);
      setEditingEvaluation(null); // make sure edit mode is off
      setDrawerOpen(true);
    } catch (error) {
      console.error("Error in handleViewEvaluation:", error);
    }
  };

  // ✅ Function to handle deleting an evaluation
  // Example: inside your component
  const handleDeleteEvaluation = async (userId) => {
    if (
      !confirm(
        "Are you sure you want to delete the last evaluation for this user?"
      )
    )
      return;

    try {
      const query = new URLSearchParams({
        userId,
        year: SerSelectedYear,
        month: SerSelectedMonth,
      }).toString();

      const res = await fetch(`/api/weeklyevaluation/delete?${query}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete evaluation");

      const data = await res.json();
      console.log("Deleted Evaluation:", data);

      // ✅ Show success message
      setMessage("✅ Last evaluation deleted successfully");
      setSuccess(true);

      // ✅ Refresh list
      await fetchEvaluations();
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      setMessage("❌ Failed to delete evaluation. Please try again.");
      setSuccess(false);
    }
  };

  // ✅ When closing the drawer, reset editingEvaluation & viewingEvaluation
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingEvaluation(null);
    setViewingEvaluation(null);
    setSelectedUserId("");
    setSelectedWeek(null);
    setWeekStart("");
    setWeekEnd("");
    setEvaluationScores([]);
    setComments("");
  };

  return (
    <div className="p-8 w-full">
      {/* Hidden Report */}
      <div className="hidden print:block">
        <Report
          ref={reportRef}
          evaluation={viewingEvaluation}
          user={users.find((u) => u.id === selectedUserId)}
          evaluationPrograms={evaluationPrograms}
        />
      </div>

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

      {/* ✅ Right Drawer (Modern + Complete with Evaluation Programs Table) */}
      <div
        className={`fixed top-0 right-0 h-full 
    w-full sm:w-[32rem] md:w-[40rem] lg:w-[40rem] 
    bg-white/90 backdrop-blur-xl shadow-2xl 
    transform transition-transform duration-500 ease-in-out 
    z-50 rounded-l-2xl 
    ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-indigo-900 text-white rounded-tl-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">
              {viewingEvaluation ? "👀" : editingEvaluation ? "✏️" : "➕"}
            </span>
            {viewingEvaluation
              ? "View Evaluation"
              : editingEvaluation
              ? "Edit Evaluation"
              : "Add New Evaluation"}
          </h2>
          <button
            onClick={handleCloseDrawer} // ✅ call reset + close function
            className="hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form
          className="flex flex-col h-[calc(100%-70px)]"
          onSubmit={(e) => {
            e.preventDefault();

            const loginId = localStorage.getItem("loginID"); // 👈 fetch from localStorage

            handleSubmit({
              weekNumber: selectedWeek, // ✅ rename here
              weekStart,
              weekEnd,
              evaluationScores,
              comments,
              userId: selectedUserId,
              evaluatedBy: loginId, // ✅ better name than loginId
              totalScore,
              totalWeightedRating: totalRating, // ✅ match schema name
            });
          }}
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-3 w-full">
              <h3 className="text-md font-semibold text-gray-800 border-b pb-2">
                📅 Select Week & Dates
              </h3>

              {/* Row 1: Week Selector (Full Width) */}
              <div className="grid grid-cols-4 gap-3 w-full">
                {[1, 2, 3, 4].map((week) => {
                  const isTaken = takenWeeks?.includes(week);
                  const isSelected = selectedWeek === week;

                  return (
                    <button
                      key={week}
                      type="button"
                      onClick={() => handleWeekSelect(week)}
                      // ⛔ disable only when adding and week already taken
                      disabled={
                        !editingEvaluation && !viewingEvaluation && isTaken
                      }
                      className={`relative w-full px-3 py-2 rounded-lg text-sm font-medium shadow transition
    ${
      !editingEvaluation && !viewingEvaluation && isTaken
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : isSelected
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
                    >
                      Week {week}
                      {/* ✅ show checkmark only in Add mode */}
                      {!editingEvaluation && !viewingEvaluation && isTaken && (
                        <span className="absolute top-1 right-1 text-green-600 text-xs font-bold">
                          ✅
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Dates (Full Width, bigger inputs, arrow inline) */}
              <div className="flex items-center justify-between gap-2 w-full">
                {/* Start Date */}
                <input
                  type="date"
                  value={weekStart}
                  disabled
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500"
                />

                {/* Arrow (inline, no extra column) */}
                <ArrowRight className="w-6 h-6 text-gray-500 mx-2" />

                {/* End Date */}
                <input
                  type="date"
                  value={weekEnd}
                  disabled
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 👤 User Dropdown */}
            {/* Row 3: User Selector (Inline under dates) */}
            <div className="w-full mt-3">
              <label className="flex items-center text-sm font-semibold text-gray-800 mb-1">
                <UserCircle className="w-4 h-4 text-indigo-600 mr-2" />
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="" disabled hidden></option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Evaluation Programs Table */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-gray-800 border-b pb-2">
                📊 Evaluation Programs
              </h3>

              {evaluationPrograms.length > 0 ? (
                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold w-[50%]">
                          KPIs
                        </th>
                        <th className="px-4 py-2 text-center font-semibold w-[20%]">
                          Wt %
                        </th>
                        <th className="px-4 py-2 text-center font-semibold w-[15%]">
                          Score
                        </th>
                        <th className="px-4 py-2 text-center font-semibold w-[15%]">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {evaluationPrograms.map((prog, index) =>
                        // Return an array of rows instead of Fragment
                        [
                          <tr
                            key={`${prog._id}-main`}
                            className="hover:bg-gray-50 transition-colors align-top"
                          >
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {prog.Name}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-600">
                              {prog.Weightage}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <select
                                value={evaluationScores[index]?.score || ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  handleScoreChange(
                                    index,
                                    val,
                                    prog.Weightage,
                                    prog._id
                                  );
                                }}
                                required
                                disabled={!!viewingEvaluation}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Select</option>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <option key={num} value={num}>
                                    {num}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-indigo-700">
                              {evaluationScores[index]?.weightedRating || "--"}
                            </td>
                          </tr>,
                        ]
                      )}

                      {/* ✅ Totals Row */}
                      <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 font-semibold">
                        <td
                          className="px-4 py-2 text-right text-gray-700"
                          colSpan={2}
                        >
                          ⬇ Total
                        </td>
                        <td className="px-4 py-2 text-center text-gray-800">
                          {evaluationScores.reduce(
                            (sum, s) => sum + Number(s?.score || 0),
                            0
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-indigo-900">
                          {evaluationScores
                            .reduce(
                              (sum, s) => sum + Number(s?.weightedRating || 0),
                              0
                            )
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ✅ Comments Section */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💬 Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={!!viewingEvaluation}
                      rows={3}
                      placeholder="Write your evaluation comments here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No evaluation programs found.
                </p>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          <div className="p-4 border-t bg-white sticky bottom-0">
            {viewingEvaluation ? (
              <button
                type="button"
                onClick={handlePrint}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-3 rounded-xl font-semibold shadow-lg transition"
              >
                🖨️ Print Report
              </button>
            ) : (
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white py-3 rounded-xl font-semibold shadow-lg transition"
              >
                💾 {editingEvaluation ? "Update Record" : "Save Record"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 🔍 Search & Toggle */}
      <div className="flex items-center justify-between p-4">
        {/* LEFT: Calendar Toggle Button */}
        <div className="flex items-center">
          <button
            onClick={() => setShowDateFilter((prev) => !prev)}
            className={`p-3 rounded-lg border bg-white shadow-sm transition ${
              showDateFilter
                ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Filter by Date"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Filters aligned right next to calendar button */}
          <div className="flex items-center gap-2 ml-2">
            {showDateFilter ? (
              <div className="flex items-center gap-2">
                {/* Start Date */}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg 
              bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 
              focus:border-indigo-500 text-sm transition"
                />

                <ArrowRight className="w-5 h-5 text-gray-500" />

                {/* End Date */}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={`${new Date(startDate).getFullYear()}-${String(
                    new Date(startDate).getMonth() + 1
                  ).padStart(2, "0")}-01`}
                  max={`${new Date(startDate).getFullYear()}-${String(
                    new Date(startDate).getMonth() + 1
                  ).padStart(2, "0")}-${new Date(
                    new Date(startDate).getFullYear(),
                    new Date(startDate).getMonth() + 1,
                    0
                  ).getDate()}`}
                  className="px-3 py-2 border border-gray-200 rounded-lg 
              bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 
              focus:border-indigo-500 text-sm transition"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Year dropdown */}
                <div className="relative">
                  <select
                    value={SerSelectedYear}
                    onChange={(e) => {
                      const SerYear = Number(e.target.value);
                      setSerSelectedYear(SerYear);
                      SerNotifyChange(
                        SerYear,
                        SerSelectedMonth,
                        SerSelectedWeeks
                      );
                    }}
                    className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-200 bg-white shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SerYears.map((SerY) => (
                      <option key={SerY} value={SerY}>
                        {SerY}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    ▾
                  </span>
                </div>

                {/* Month dropdown */}
                <div className="relative">
                  <select
                    value={SerSelectedMonth}
                    onChange={(e) => {
                      const SerMonth = Number(e.target.value);
                      setSerSelectedMonth(SerMonth);
                      SerNotifyChange(
                        SerSelectedYear,
                        SerMonth,
                        SerSelectedWeeks
                      );
                    }}
                    className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-200 bg-white shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SerMonths.map((SerM) => (
                      <option key={SerM.SerValue} value={SerM.SerValue}>
                        {SerM.SerLabel}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    ▾
                  </span>
                </div>

                {/* Weeks */}
                <div className="flex items-center gap-1">
                  {SerWeeks.map((SerW) => {
                    const SerActive = SerSelectedWeeks.includes(SerW);
                    return (
                      <button
                        key={SerW}
                        type="button"
                        onClick={() => {
                          let SerNewWeeks;
                          if (SerActive) {
                            SerNewWeeks = SerSelectedWeeks.filter(
                              (w) => w !== SerW
                            );
                          } else {
                            SerNewWeeks = [...SerSelectedWeeks, SerW];
                          }
                          setSerSelectedWeeks(SerNewWeeks);
                          SerNotifyChange(
                            SerSelectedYear,
                            SerSelectedMonth,
                            SerNewWeeks
                          );
                        }}
                        className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition
                    ${
                      SerActive
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:shadow"
                    }`}
                      >
                        {SerW}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Toggle buttons */}
        {!isMobile && (
          <div className="flex gap-2">
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

      {/* ✅ Table view */}
      {viewMode === "list" && !isMobile ? (
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
          <table className="w-full table-fixed text-left">
            <thead className="bg-indigo-900 text-white">
              <tr>
                {/* Add Button Column */}
                <th className="px-4 py-3 w-2/12 text-center"></th>
                <th className="px-4 py-3 w-2/12">Name</th>
                <th className="px-4 py-3 w-2/12">Weeks</th>
                <th className="px-4 py-3 w-2/12">Start Date</th>
                <th className="px-4 py-3 w-2/12">End Date</th>
                <th className="px-4 py-3 w-1/12 text-right">Score</th>
                <th className="px-4 py-3 w-1/12 text-right">Rating</th>
                <th className="px-4 py-3 w-2/12 text-center">Performance</th>
                <th className="px-4 py-3 w-1/12 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {evaluations.map((ev) => {
                let performance = ev.performance || "";
                let colorClass = "text-gray-500 font-medium";

                if (performance === "Poor")
                  colorClass = "text-red-600 font-semibold";
                else if (performance === "Partial")
                  colorClass = "text-orange-500 font-semibold";
                else if (performance === "Normal")
                  colorClass = "text-yellow-500 font-semibold";
                else if (performance === "Good")
                  colorClass = "text-green-600 font-semibold";
                else if (performance === "Excellent")
                  colorClass = "text-blue-600 font-semibold";

                return (
                  <tr key={ev._id} className="hover:bg-indigo-50 border-b">
                    {/* View & Edit Buttons */}
                    <td className="px-4 py-4 text-center align-middle">
                      <div className="flex justify-center items-center gap-6">
                        <button
                          onClick={() => handleViewEvaluation(ev._id)}
                          className="text-indigo-600 hover:text-indigo-900 transition"
                          title="View Evaluation"
                        >
                          <Glasses className="w-6 h-6" />
                        </button>

                        {(currentUserRole === "Super Admin" ||
                          currentUserRole === "HR" ||
                          currentUserRole === "Management") && (
                          <button
                            onClick={() => handleEditEvaluation(ev._id)}
                            className="text-indigo-600 hover:text-indigo-900 transition"
                            title="Edit Evaluation"
                          >
                            <Edit className="w-6 h-6" />
                          </button>
                        )}
                        {/* Add New Record */}
                        {(currentUserRole === "Super Admin" ||
                          currentUserRole === "HR" ||
                          currentUserRole === "Management") && (
                          <button
                            onClick={() => handleAddUser(ev._id)}
                            className="text-indigo-600 hover:text-indigo-900 transition"
                            title="Add New Record"
                          >
                            <FilePlus className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Data Columns */}
                    <td className="px-4 py-4 truncate">{ev.fullName || ""}</td>

                    {/* Weeks Column */}
                    <td className="px-4 py-4 truncate">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((week) => {
                          const isActive = ev.weekNumbers?.includes(week);

                          return (
                            <span
                              key={week}
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition
                        ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-400"
                        }
                      `}
                              title={`Week ${week}`}
                            >
                              {week}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Start Date */}
                    <td className="px-4 py-4 truncate">
                      {ev.weekStart
                        ? new Date(ev.weekStart).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </td>

                    {/* End Date (narrower column) */}
                    <td className="px-4 py-4 truncate">
                      {ev.weekEnd
                        ? new Date(ev.weekEnd).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </td>

                    {/* Score + Rating (right aligned) */}
                    <td className="px-4 py-4 truncate text-right">
                      {ev.totalScoreSum > 0 ? ev.totalScoreSum : ""}
                    </td>
                    <td className="px-4 py-4 truncate text-right">
                      {ev.totalWeightedRatingSum > 0
                        ? ev.totalWeightedRatingSum.toFixed(2)
                        : ""}
                    </td>

                    {/* Performance full word */}
                    <td
                      className={`px-4 py-4 truncate text-center ${colorClass}`}
                    >
                      {performance || ""}
                    </td>

                    {/* Delete Button */}
                    <td className="px-4 py-4 text-center">
                      {(currentUserRole === "Super Admin" ||
                        currentUserRole === "HR" ||
                        currentUserRole === "Management") && (
                        <button
                          onClick={() => handleDeleteEvaluation(ev._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete Evaluation"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      )}
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
          {evaluations.map((ev) => {
            // ✅ Use API fields
            const score = ev.totalScoreSum || 0;
            const weighted = ev.totalWeightedRatingSum || 0;

            // ✅ Performance badge
            let performance = ev.performance || "N/A";
            let badgeClass = "bg-gray-200 text-gray-600";

            if (performance === "Poor") {
              badgeClass = "bg-red-200/80 text-red-900";
            } else if (performance === "Partial") {
              badgeClass = "bg-orange-200/80 text-orange-900";
            } else if (performance === "Normal") {
              badgeClass = "bg-yellow-200/80 text-yellow-900";
            } else if (performance === "Good") {
              badgeClass = "bg-green-200/80 text-green-900";
            } else if (performance === "Excellent") {
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
                    {ev.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 transition">
                      {ev.fullName || "N/A"}
                    </h3>
                    {/* Weeks Inline */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Icon + label */}
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        Weeks
                      </div>

                      {/* Equal-size smaller bars */}
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((week) => {
                          const isActive = ev.weekNumbers?.includes(week);
                          return (
                            <div
                              key={week}
                              className={`w-5 h-1.5 rounded-full transition
            ${isActive ? "bg-indigo-500 shadow-md" : "bg-gray-200"}
          `}
                              title={`Week ${week}`}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  {/* Dates */}
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
                      {score}
                    </span>
                  </p>

                  {/* Weighted */}
                  <p className="flex justify-between items-center">
                    <span className="flex items-center gap-2 font-medium">
                      <TrendingUp className="w-4 h-4 text-green-500" /> Weighted
                    </span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {weighted.toFixed(2)}
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
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {/* Add Record */}
                  <button
                    onClick={() => handleAddUser(ev._id)}
                    className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
                    title="Add Record"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Edit (restricted roles) */}
                  {(currentUserRole === "Super Admin" ||
                    currentUserRole === "HR" ||
                    currentUserRole === "Management") && (
                    <button
                      onClick={() => handleEditEvaluation(ev._id)}
                      className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  {/* View */}
                  <button
                    onClick={() => handleViewEvaluation(ev._id)}
                    className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
                    title="View"
                  >
                    <Glasses className="w-4 h-4" />
                  </button>

                  {/* Delete (restricted roles) */}
                  {(currentUserRole === "Super Admin" ||
                    currentUserRole === "HR" ||
                    currentUserRole === "Management") && (
                    <button
                      onClick={() => handleDeleteEvaluation(ev._id)}
                      className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
