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
  BarChart3,
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
  const [takenWeeks, setTakenWeeks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const DEFAULT_SCORE = 5;

  // 1️⃣ Initialize evaluationScores once when programs load
  useEffect(() => {
    if (evaluationPrograms && evaluationPrograms.length > 0) {
      const initialScores = evaluationPrograms.map((prog) => ({
        _id: prog._id,
        score: DEFAULT_SCORE,
        weightage: prog.Weightage,
        weightedRating: parseFloat(
          ((DEFAULT_SCORE * prog.Weightage) / 100).toFixed(2)
        ),
      }));
      setEvaluationScores(initialScores);
    }
  }, [evaluationPrograms]);

  // Handle score input + calculate weighted rating
  const handleScoreChange = (index, score, weightage, progId) => {
    const newScores = [...evaluationScores];
    const numericScore = parseFloat(score) || 0;

    // Correct calculation with 2 decimal places
    const weightedRating = ((numericScore * weightage) / 100).toFixed(2);

    newScores[index] = {
      _id: progId,
      score: numericScore,
      weightage,
      weightedRating: parseFloat(weightedRating), // store as number, not string
    };

    setEvaluationScores(newScores);
  };

  const [permissions, setPermissions] = useState({
    view: false,
    edit: false,
    add: false,
    delete: false,
    applyKpi: false,
  });

  // ✅ Fetch and set permissions from userAccess
  useEffect(() => {
    const accessData = JSON.parse(localStorage.getItem("userAccess") || "{}");
    const formAccess = accessData.formAccess || [];

    const activeFormId = localStorage.getItem("activeForm");

    // ✅ Extract userId from accessData
    if (accessData.userId) {
      //
    } else {
      console.warn("⚠️ No userId found in userAccess data.");
    }

    if (!activeFormId || formAccess.length === 0) {
      console.warn("⚠️ No form access data found for this user.");
      return;
    }

    const currentForm = formAccess.find(
      (f) => String(f.formId) === String(activeFormId)
    );

    if (currentForm) {
      if (currentForm.fullAccess) {
        setPermissions({
          view: true,
          edit: true,
          add: true,
          delete: true,
          applyKpi: true,
        });
      } else if (currentForm.partialAccess?.enabled) {
        const perms = currentForm.partialAccess.permissions || {};
        setPermissions({
          view: perms.view || false,
          edit: perms.edit || false,
          add: perms.add || false,
          delete: perms.delete || false,
          applyKpi: perms.applyKpi || false,
        });
      } else {
        setPermissions({
          view: false,
          edit: false,
          add: false,
          delete: false,
          applyKpi: false,
        });
      }
    } else {
      console.warn("⚠️ No matching form access found.");
    }
  }, []);

  // Example usage
  const canView = permissions.view;
  const canEdit = permissions.edit;
  const canAdd = permissions.add;
  const canDelete = permissions.delete;
  const canApplyKpi = permissions.applyKpi;

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

  //search>>>>>>>>>>>>>>>>>>>>>>>>>
  const SerNotifyChange = async (SerYear, SerMonth, SerWeeks) => {
    try {
      // ✅ Get role & userID
      const role = localStorage.getItem("userRole");
      const userId = localStorage.getItem("loginID");

      let weekParam = undefined;

      if (Array.isArray(SerWeeks)) {
        // If all weeks selected (1,2,3,4) => skip sending week
        const allWeeks = [1, 2, 3, 4];
        const isAllWeeks =
          SerWeeks.length === allWeeks.length &&
          allWeeks.every((w) => SerWeeks.includes(w));

        if (!isAllWeeks) {
          weekParam = SerWeeks.join(","); // Only send if not all weeks
        }
      } else if (SerWeeks) {
        weekParam = String(SerWeeks); // Single value
      }

      // ✅ Build query params
      const query = new URLSearchParams({
        year: SerYear,
        month: SerMonth,
        ...(weekParam ? { week: weekParam } : {}),
        ...(role !== "Super Admin" &&
        role !== "Management" &&
        role !== "HR" &&
        role !== "Admin"
          ? { userId } // add userId for non-admins
          : {}),
      }).toString();

      // ✅ Choose API endpoint based on role
      const endpoint =
        role === "Super Admin" ||
        role === "Management" ||
        role === "HR" ||
        role === "Admin"
          ? `/api/weeklyevaluation/performance/monthly?${query}`
          : `/api/weeklyevaluation/performance/monthly/usermonthly?${query}`;

      // ✅ Fetch data
      const res = await fetch(endpoint);
      const data = await res.json();

      if (Array.isArray(data)) {
        setEvaluations(data);
      } else {
        console.error("Unexpected API response:", data);
        setEvaluations([]);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  };

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

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const fetchInitialData = async () => {
      setLoading(true); // ✅ start loading

      try {
        const role = localStorage.getItem("userRole");
        const loginID = localStorage.getItem("loginID");
        setCurrentUserRole(role);

        // ✅ Call SerNotifyChange with default values
        await SerNotifyChange(
          SerSelectedYear,
          SerSelectedMonth,
          SerSelectedWeeks
        );
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      } finally {
        setLoading(false); // ✅ stop loading
      }
    };

    fetchInitialData();
  });

  useEffect(() => {
    fetchEvaluationPrograms();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
        <p className="text-indigo-600 text-lg font-medium animate-pulse">
          Fetching evaluations...
        </p>
      </div>
    );

  const formatDatePKT = (date) => {
    return date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi", // Force PKT
    }); // gives yyyy-mm-dd
  };

  const handleAddUser = async (userId) => {
    try {
      const currentyear = SerSelectedYear;
      const currentMonth = SerSelectedMonth;

      // ✅ Fetch user's evaluation data for this month
      const res = await fetch(
        `/api/weeklyevaluation/performance/${userId}?month=${currentMonth}&year=${currentyear}`
      );
      const data = await res.json();
      const existingWeeks = data?.uniqueWeeks || [];
      const weekCount = data?.weekCount || 0;

      if (weekCount === 4) {
        setMessage(
          "🎉 This month's evaluation has been completed. Congratulations!"
        );
        handleCloseDrawer();
        setSuccess(true);
        setTimeout(() => setMessage(""), 4000);
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

      // ✅ Calculate week start/end
      const year = currentyear;
      const month = currentMonth - 1; // JS month is 0-based
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const totalDays = lastDayOfMonth.getDate();
      const daysPerWeek = Math.ceil(totalDays / 4);

      const start = new Date(year, month, (defaultWeek - 1) * daysPerWeek + 1);
      let end = new Date(year, month, defaultWeek * daysPerWeek);
      if (end > lastDayOfMonth) end = lastDayOfMonth;

      setWeekStart(formatDatePKT(start));
      setWeekEnd(formatDatePKT(end));
      setSelectedUserId(userId);
      setEditingEvaluation(null);
      setMessage("");
    } catch (err) {
      console.error("Error fetching user evaluations:", err);
      setMessage("⚠️ Failed to fetch evaluations.");
      setSuccess(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleWeekSelect = async (week) => {
    if (editingEvaluation) {
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

  const totalScore = evaluationScores.reduce(
    (sum, s) => sum + Number(s?.score || 0),
    0
  );

  const totalRating = evaluationScores
    .reduce((sum, s) => sum + Number(s?.weightedRating || 0), 0)
    .toFixed(2);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);

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

      await SerNotifyChange(
        SerSelectedYear,
        SerSelectedMonth,
        SerSelectedWeeks
      );

      await handleAddUser(payload.userId);

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
      setIsSubmitting(false);
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
      setMessage("");
    } catch (error) {
      console.error("Error in handleEditEvaluation:", error);
    }
  };

  // ✅ Function to handle viewing an evaluation (read-only mode)
  const handleViewEvaluation = async (userId) => {
    const querytest = new URLSearchParams({
      userId,
      year: SerSelectedYear,
      month: SerSelectedMonth,
      weekNumber: 1, // ✅ always pass week = 1
    }).toString();

    // ✅ Navigate with query params
    router.push(`/main/WeeklyEvaluationViewEdit?${querytest}`);
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

      if (!res.ok) {
        let message = "❌ Failed to delete evaluation. Please try again.";

        try {
          // Try to parse server message (if JSON)
          const errorData = await res.json();
          if (errorData?.message) message = `⚠️ ${errorData.message}`;
        } catch {
          // fallback if not valid JSON
          const text = await res.text();
          if (text) message = `⚠️ ${text}`;
        }

        setMessage(message);
        setSuccess(false);
        setTimeout(() => setMessage(""), 4000);
        return;
      }

      const data = await res.json();

      // ✅ Show success message
      setMessage("✅ Last evaluation deleted successfully");
      setSuccess(true);
      setTimeout(() => setMessage(""), 3000);
      // ✅ Refresh list
      await SerNotifyChange(
        SerSelectedYear,
        SerSelectedMonth,
        SerSelectedWeeks
      );
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      setMessage("❌ Failed to delete evaluation. Please try again.");
      setSuccess(false);
    }
  };

  // ✅ When closing the drawer, reset editingEvaluation
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingEvaluation(null);
    setSelectedUserId("");
    setSelectedWeek(null);
    setWeekStart("");
    setWeekEnd("");
    setEvaluationScores([]);
    setComments("");
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
      {/* ✅ Right Drawer (Modern + Complete with Evaluation Programs Table) */}
      <div
        className={`fixed top-0 right-0 h-full 
    w-full sm:w-[32rem] md:w-[40rem] lg:w-[40rem] 
    bg-white/90 backdrop-blur-xl shadow-2xl 
    transform transition-transform duration-500 ease-in-out 
    z-50 rounded-l-2xl 
    ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
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
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-indigo-900 text-white rounded-tl-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">{editingEvaluation ? "✏️" : "➕"}</span>
            {editingEvaluation ? "Edit Evaluation" : "Add New Evaluation"}
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
                      disabled={!editingEvaluation && isTaken}
                      className={`relative w-full px-3 py-2 rounded-lg text-sm font-medium shadow transition
    ${
      !editingEvaluation && isTaken
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : isSelected
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
                    >
                      Week {week}
                      {/* ✅ show checkmark only in Add mode */}
                      {!editingEvaluation && isTaken && (
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 cursor-not-allowed focus:ring-2 focus:ring-indigo-500"
                />

                {/* Arrow (inline, no extra column) */}
                <ArrowRight className="w-6 h-6 text-gray-500 mx-2" />

                {/* End Date */}
                <input
                  type="date"
                  value={weekEnd}
                  disabled
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 cursor-not-allowed focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 cursor-not-allowed"
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
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                              >
                                <option value="">Select</option>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <option
                                    key={num}
                                    value={num}
                                    style={{
                                      backgroundColor:
                                        num === 1
                                          ? "#fecaca"
                                          : num === 2
                                          ? "#fde68a"
                                          : num === 3
                                          ? "#fef3c7"
                                          : num === 4
                                          ? "#bbf7d0"
                                          : "#86efac",
                                      color: "#000",
                                    }}
                                  >
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
                              (sum, s) => sum + (s.weightedRating || 0),
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
                      💬 If any critical comment
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      placeholder="Write your evaluation comments here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white text-gray-900"
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
            {
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white py-3 rounded-xl font-semibold shadow-lg transition"
              >
                💾 {editingEvaluation ? "Update Record" : "Save Record"}
              </button>
            }
          </div>
        </form>
      </div>

      {/* 🔍 Search & Toggle */}
      <div className="flex items-center justify-between p-2">
        {/* LEFT: Calendar Toggle Button */}
        <div className="flex items-center">
          {/* Filters aligned right next to calendar button */}
          <div className="flex items-center gap-2 ml-2">
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
                  className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>
        </div>

        {/* RIGHT: Toggle buttons */}
        <div className="flex gap-2">
          {/* List + Card View (only desktop) */}
          {!isMobile && (
            <>
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
            </>
          )}

          {/* ✅ Always visible on mobile & desktop, with left margin */}
          <button
            onClick={() => router.push(`/main/EvaluationPrograms`)}
            className={`p-2 rounded-lg border transition ml-3 ${
              viewMode === "programs"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            title="Evaluation Programs"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ✅ Table view */}
      {viewMode === "list" && !isMobile ? (
        <div className="overflow-x-auto bg-gradient-to-br from-gray-50 to-white p-4 rounded-3xl shadow-xl border border-gray-100">
          <table className="w-full border-separate border-spacing-y-2">
            <thead className="bg-indigo-900 text-white text-xs uppercase tracking-wider rounded-xl">
              <tr>
                <th className="px-4 py-4 text-center w-[14%] rounded-l-xl"></th>
                <th className="px-4 py-4 text-left w-[18%]">Name</th>
                <th className="px-4 py-4 text-center w-[10%]">Weeks</th>
                <th className="px-4 py-4 text-center w-[15%]">Start Date</th>
                <th className="px-4 py-4 text-center w-[15%]">End Date</th>
                <th className="px-4 py-4 text-right w-[10%]">AVG Rating</th>
                <th className="px-4 py-4 text-center w-[12%]">Performance</th>
                <th className="px-4 py-4 text-center w-[10%] rounded-r-xl">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {evaluations.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-500 font-medium bg-white/80 backdrop-blur-sm rounded-2xl shadow-inner"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => {
                  let performance = ev.performance || "";
                  let colorClass = "text-gray-600 font-medium";
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
                    <tr
                      key={ev._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Action buttons */}
                      <td className="px-4 py-5 text-center align-middle rounded-l-2xl">
                        <div className="flex justify-center items-center gap-4">
                          {/* 👁️ View Button */}
                          {canView && (
                            <button
                              onClick={() => handleViewEvaluation(ev._id)}
                              className="text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                              title="View Evaluation"
                            >
                              <Glasses className="w-6 h-6" />
                            </button>
                          )}

                          {/* ✏️ Edit Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleEditEvaluation(ev._id)}
                              className="text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                              title="Edit Evaluation"
                            >
                              <Edit className="w-6 h-6" />
                            </button>
                          )}

                          {/* ➕ Add Record Button */}
                          {canAdd && (
                            <button
                              onClick={() => handleAddUser(ev._id)}
                              className="text-indigo-600 hover:text-indigo-900 hover:scale-110 transition-all"
                              title="Add New Record"
                            >
                              <FilePlus className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-5 text-gray-900 font-semibold truncate text-base">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {ev.fullName ? ev.fullName[0] : "?"}
                          </div>
                          <span>{ev.fullName || ""}</span>
                        </div>
                      </td>

                      {/* Weeks */}
                      <td className="px-4 py-5 text-center">
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3, 4].map((week) => {
                            const isActive = ev.weekNumbers?.includes(week);
                            return (
                              <span
                                key={week}
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition ${
                                  isActive
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-gray-200 text-gray-400"
                                }`}
                                title={`Week ${week}`}
                              >
                                {week}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-5 text-center text-gray-700 text-sm">
                        {ev.weekStart
                          ? new Date(ev.weekStart).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </td>

                      {/* End Date */}
                      <td className="px-4 py-5 text-center text-gray-700 text-sm">
                        {ev.weekEnd
                          ? new Date(ev.weekEnd).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </td>

                      {/* AVG Rating */}
                      <td className="px-4 py-5 text-right font-semibold text-gray-800">
                        {ev.avgWeightedRating > 0
                          ? ev.avgWeightedRating.toFixed(2)
                          : "-"}
                      </td>

                      {/* Performance */}
                      <td
                        className={`px-4 py-5 text-center ${colorClass} text-sm font-semibold`}
                      >
                        {performance || ""}
                      </td>

                      {/* 🗑️ Delete */}
                      <td className="px-4 py-5 text-center rounded-r-2xl">
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteEvaluation(ev._id)}
                            className="text-red-600 hover:text-red-800 hover:scale-110 transition-all"
                            title="Delete Evaluation"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Modern Card View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
  {evaluations.map((ev) => {
    const score = ev.totalScoreSum || 0;
    const weighted = ev.totalWeightedRatingSum || 0;

    let performance = ev.performance || "N/A";
    let badgeClass = "bg-gray-200 text-gray-600";
    if (performance === "Poor")
      badgeClass = "bg-red-200/80 text-red-900";
    else if (performance === "Partial")
      badgeClass = "bg-orange-200/80 text-orange-900";
    else if (performance === "Normal")
      badgeClass = "bg-yellow-200/80 text-yellow-900";
    else if (performance === "Good")
      badgeClass = "bg-green-200/80 text-green-900";
    else if (performance === "Excellent")
      badgeClass = "bg-blue-200/80 text-blue-900";

    return (
      <div
        key={ev._id}
        className="relative bg-white backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl transition rounded-2xl p-6 group overflow-hidden"
      >
        {/* Gradient Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {ev.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition">
              {ev.fullName || "N/A"}
            </h3>
            {/* Weeks Inline */}
            <div className="flex items-center gap-2 mt-2">
              {/* Icon + label */}
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
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
                      className={`w-5 h-1.5 rounded-full transition ${
                        isActive ? "bg-indigo-500 shadow-md" : "bg-gray-200"
                      }`}
                      title={`Week ${week}`}
                    ></div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-4 text-sm text-gray-700">
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

            <span className="text-gray-500">→</span>

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
            <span className="font-medium text-indigo-700">{score}</span>
          </p>

          {/* Weighted */}
          <p className="flex justify-between items-center">
            <span className="flex items-center gap-2 font-medium">
              <TrendingUp className="w-4 h-4 text-green-500" /> Weighted
            </span>
            <span className="font-medium text-green-700">
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

        {/* ✅ Actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {canAdd && (
            <button
              onClick={() => handleAddUser(ev._id)}
              className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition shadow-sm"
              title="Add Record"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => handleEditEvaluation(ev._id)}
              className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canView && (
            <button
              onClick={() => handleViewEvaluation(ev._id)}
              className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition shadow-sm"
              title="View"
            >
              <Glasses className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
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
    </div>
  );
}
