"use client";
import { use, useEffect, useState, useCallback, useRef, useMemo } from "react";

export default function WeeklyEvaluationViewEdit({ searchParams }) {
  const params = use(searchParams);
  const { userId, year, month, weekNumber } = params || {};
  const [user, setUser] = useState(null);
  const [evaluationPrograms, setEvaluationPrograms] = useState([]);
  const [evaluationScores, setEvaluationScores] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(
    weekNumber ? [Number(weekNumber)] : [1]
  );
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const weeks = [1, 2, 3, 4];
  const didFetch = useRef(false);

  const [totalScore, setTotalScore] = useState(0);
  const [totalWeightedRating, setTotalWeightedRating] = useState(0);
  const [performance, setPerformance] = useState("");
  const [viewMode, setViewMode] = useState("Weekly");
  const [selectedMonths, setSelectedMonths] = useState([Number(month)]);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [Action, setAction] = useState("");
  const [Increment, setIncrement] = useState("");
  const didFetchMonthly = useRef(false);

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

  const toggleMonth = (monthNumber) => {
    setSelectedMonths(
      (prev) =>
        prev.includes(monthNumber)
          ? prev.filter((m) => m !== monthNumber) // uncheck
          : [...prev, monthNumber] // check
    );
  };

  // ✅ Fetch evaluation record for selected weeks
  const fetchEvaluationRecord = useCallback(
    async (weeksArray, programs = evaluationPrograms) => {
      try {
        const query = new URLSearchParams({ userId, year, month });
        query.append("weekNumbers", weeksArray.join(","));

        const res = await fetch(`/api/weeklyevaluation/overview?${query}`);

        if (!res.ok) {
          if (res.status === 404) {
            console.warn("❌ No records found, week not selected:", weeksArray);
            return;
          } else {
            const errorData = await res.json();
            console.error("❌ Server error:", errorData);
            alert("Something went wrong: " + errorData.error);
            return;
          }
        }

        const data = await res.json();

        //console.log(">>>>>>>>>>>>>>>>data ", data);

        // ✅ Update selected weeks only where found = true
        const updatedWeeks = data.foundWeeks
          .filter((fw) => fw.found)
          .map((fw) => fw.week);

        setSelectedWeek(updatedWeeks);

        // Set week start & end
        setWeekStart(data.weekStart?.split("T")[0] || "");
        setWeekEnd(data.weekEnd?.split("T")[0] || "");

        // Map scores to programs, default 0 if missing
        const scoresMap = new Map(
          (data.scores || []).map((s) => [s.kpiId.toString(), s])
        );

        setEvaluationScores(
          programs.map((program) => {
            const scoreObj = scoresMap.get(program._id.toString()) || {};
            return {
              kpiId: program._id,
              score: scoreObj.score ?? 0,
              weightage: scoreObj.weightage ?? program.Weightage,
              weightedRating: scoreObj.weightedRating ?? 0,
            };
          })
        );

        // ✅ Set totals and performance
        setTotalScore(data.totalScore ?? 0);
        setTotalWeightedRating(data.totalWeightedRating ?? 0);
        setPerformance(data.performance ?? "");
        setMonthlyAverage(data.monthlyAverage ?? 0);
        setAction(data.Action ?? "");
      } catch (err) {
        console.error("❌ Failed to fetch evaluation record:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, year, month, evaluationPrograms]
  );

  // ✅ Fetch user
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    }
  }, [userId]);

  // ✅ Fetch evaluation programs
  const fetchEvaluationPrograms = useCallback(async () => {
    try {
      const res = await fetch("/api/weeklyevaluation/evaluationprograms");
      if (!res.ok) throw new Error("Failed to fetch evaluation programs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvaluationPrograms(data);
        // Fetch Week 1 evaluation immediately
        fetchEvaluationRecord([1], data);
      }
    } catch (err) {
      console.error("❌ Failed to fetch evaluation programs:", err);
    }
  }, [fetchEvaluationRecord]);

  // ✅ First load
  useEffect(() => {
    if (userId && year && month && !didFetch.current) {
      didFetch.current = true;
      fetchUser();
      fetchEvaluationPrograms();
    }
  }, [userId, year, month, fetchUser, fetchEvaluationPrograms]);

  // ✅ Handle week selection
  const handleWeekClick = (week) => {
    // Always set the selected week to the clicked one
    const updated = [week];
    // Fetch evaluation record for the selected week
    fetchEvaluationRecord(updated);
  };

const fetchMonthlyData = useCallback(
  async (months) => {
    try {
      const monthsParam = months.join(",");
      const res = await fetch(
        `/api/weeklyevaluation/multi-month?year=${year}&months=${monthsParam}&userId=${userId}`
      );

      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const result = await res.json();
      const data = result[0] || {};

      console.log("📦 API Response >>>>>>>", data);

      // ✅ Update states
      setSelectedWeek(data.weeksCovered || []);

      // Set week start & end
      setWeekStart(data.monthStart?.split("T")[0] || "");
      setWeekEnd(data.monthEnd?.split("T")[0] || "");

      // ✅ Map scores to programs
      const scoresMap = new Map(
        (data.scores || []).map((s) => [s.kpiId.toString(), s])
      );

      const weeks = data.weeksCovered || [];
      const weekCount = weeks.length || 1; // ✅ For average calculation

      // ✅ Calculate averages and round
      const updatedScores = evaluationPrograms.map((program) => {
        const scoreObj = scoresMap.get(program._id.toString()) || {};
        const score = scoreObj.score ?? 0;
        const weightedRating = scoreObj.weightedRating ?? 0;
        const weightage = scoreObj.weightage ?? program.Weightage;

        // ✅ Divide by week count and round
        const avgScore = score / weekCount;
        const avgWeightedRating = weightedRating / weekCount;

        return {
          kpiId: program._id,
          score: parseFloat(avgScore.toFixed(2)), // 🎯 rounded to 2 decimals
          weightage,
          weightedRating: parseFloat(avgWeightedRating.toFixed(2)), // 🎯 rounded to 2 decimals
        };
      });

      // ✅ Set evaluation scores
      setEvaluationScores(updatedScores);

      // ✅ Recalculate total score & total weighted rating from averaged data
      const totalScore = updatedScores.reduce((sum, s) => sum + s.score, 0);
      const totalWeightedRating = updatedScores.reduce(
        (sum, s) => sum + s.weightedRating,
        0
      );

      // ✅ Round totals
      const roundedTotalScore = parseFloat(totalScore.toFixed(2));
      const roundedTotalWeightedRating = parseFloat(
        totalWeightedRating.toFixed(2)
      );

      // ✅ Set totals and other fields
      setTotalScore(roundedTotalScore);
      setTotalWeightedRating(roundedTotalWeightedRating);
      setPerformance(data.performance ?? "");
      setMonthlyAverage(data.monthlyAverage ?? 0);
      setAction(data.Action ?? "");
      setIncrement(data.Increment ?? "");

      // 🧮 Log for verification
      console.log("🧮 Week Count:", weekCount);
      console.log("📊 Rounded Total Score:", roundedTotalScore);
      console.log("📊 Rounded Total Weighted Rating:", roundedTotalWeightedRating);
    } catch (error) {
      console.error("❌ Error fetching monthly data:", error);
    }
  },
  [year, evaluationPrograms, userId]
);


  // ✅ Toggle month selection
  const handleMonthClick = (monthNumber) => {
    setSelectedMonths((prev) =>
      prev.includes(monthNumber)
        ? prev.filter((m) => m !== monthNumber)
        : [...prev, monthNumber]
    );
  };

  /// ✅ Fetch when months change
  useEffect(() => {
    if (viewMode === "Monthly" && selectedMonths.length > 0) {
      if (didFetchMonthly.current) return; // prevent duplicate fetch in StrictMode
      didFetchMonthly.current = true;
      fetchMonthlyData(selectedMonths);
    }
  }, [selectedMonths, viewMode, fetchMonthlyData]);

  // ✅ Set default month when switching to Monthly
  useEffect(() => {
    if (viewMode === "Monthly") {
      // 👉 Reset to current month when switching to Monthly mode
      setSelectedMonths([Number(month)]);
      didFetchMonthly.current = false; // allow next monthly fetch
    } else if (viewMode === "Weekly") {
      // 👉 Reset to default week (e.g., week 1) or keep the current week
      const updated = [Number(weekNumber) || 1];
      setSelectedWeek(updated);

      // 👉 Fetch evaluation record for the selected week
      fetchEvaluationRecord(updated);
    }
  }, [viewMode, month, weekNumber, fetchEvaluationRecord]);

  const incrementDisplay = useMemo(() => {
  if (Increment && Increment !== "") return Increment;

  if (monthlyAverage <= 1) return "NO";
  if (monthlyAverage <= 2) return "0.5%";
  if (monthlyAverage <= 3) return "1%";
  if (monthlyAverage <= 4) return "1.5%";
  if (monthlyAverage <= 5) return "2%";
  
  return "2%"; // optional fallback
}, [Increment, monthlyAverage]);

  const incrementIcon = useMemo(() => {
    if (!incrementDisplay || incrementDisplay === "NO") return "❌";
    if (incrementDisplay === "1%") return "📈";
    if (incrementDisplay === "1.5%") return "💹";
    if (incrementDisplay === "2%") return "🏆";
    return "❌";
  }, [incrementDisplay]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-4 drop-shadow-sm">
          {/* Year Circle */}
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-yellow-900 font-bold text-xl shadow-lg">
            {year}
          </span>
          Evaluation Overview
          {/* Modern Inline Toggle */}
          <span className="flex items-center gap-4 text-base font-medium text-gray-600">
            <button
              onClick={() => setViewMode("Monthly")}
              className={`transition-colors duration-200 px-3 py-1 rounded-full ${
                viewMode === "Monthly"
                  ? "text-indigo-600 font-semibold bg-indigo-50"
                  : "hover:text-indigo-400 hover:bg-gray-100"
              }`}
            >
              Monthly
            </button>
            <span className="text-gray-400 font-bold">|</span>
            <button
              onClick={() => setViewMode("Weekly")}
              className={`transition-colors duration-200 px-3 py-1 rounded-full ${
                viewMode === "Weekly"
                  ? "text-indigo-600 font-semibold bg-indigo-50"
                  : "hover:text-indigo-400 hover:bg-gray-100"
              }`}
            >
              Weekly
            </button>
          </span>
        </h1>

        {/* Monthly Selector */}
        {viewMode === "Monthly" && (
          <div className="flex justify-center flex-wrap gap-2 mt-4">
            {months.map((month, idx) => {
              const monthNumber = idx + 1;
              const isSelected = selectedMonths.includes(monthNumber);

              return (
                <button
                  key={month}
                  className={`px-4 py-1.5 rounded-full font-medium transition shadow-sm ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        )}

        {/* Week Selector */}
        {viewMode === "Weekly" && (
          <div className="flex justify-center space-x-3 mt-4">
            {weeks.map((week) => {
              const isSelected = selectedWeek.includes(week);
              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => handleWeekClick(week)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-110"
                      : "bg-white/70 text-gray-700 hover:bg-indigo-50 hover:scale-105"
                  }`}
                >
                  {week}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User & General Info */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Info */}
        {user && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
            <div className="flex items-center space-x-5">
              {/* Avatar or Image */}
              {userId ? (
                <Image
                  src={getUserImagePath(userId)}
                  alt="User Avatar"
                  className="h-16 w-16 rounded-2xl border-2 border-indigo-200 shadow-md"
                  onError={handleImageError}
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {user.firstName[0]}
                </div>
              )}

              {/* User Info */}
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500">{user.primaryEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Periods */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="text-indigo-600">📆</span> Evaluation Periods
          </h2>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 rounded-full font-medium shadow-sm">
              Year: {year}
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-full font-medium shadow-sm">
              Month:{" "}
              {new Date(year, month - 1).toLocaleString("en-US", {
                month: "long",
              })}
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 rounded-full font-medium shadow-sm">
              Week: {selectedWeek.join(", ")}
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full font-medium shadow-sm">
              Period:{" "}
              {weekStart
                ? new Date(weekStart).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "N/A"}{" "}
              →{" "}
              {weekEnd
                ? new Date(weekEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Programs */}
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            📝 Evaluation Programs & Scores
          </h2>

          {evaluationPrograms.length === 0 ? (
            <p className="text-gray-500 text-center">No programs found.</p>
          ) : (
            <div>
              <div className="divide-y divide-gray-200">
                {evaluationPrograms.map((program, idx) => (
                  <div
                    key={program._id}
                    className="py-5 flex justify-between items-start transition hover:bg-indigo-50/50 px-2 rounded-xl"
                  >
                    {/* Program Info */}
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900">
                        {program.Name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {program.Description}
                      </p>
                      <p className="text-xs text-indigo-500 mt-1 font-medium">
                        Weightage: {program.Weightage}%
                      </p>
                    </div>

                    {/* Scores stacked */}
                    <div className="flex flex-col items-end space-y-1">
                      <p className="text-indigo-600 font-semibold">
                        Score: {evaluationScores[idx]?.score ?? 0}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Weighted Rating:{" "}
                        {evaluationScores[idx]?.weightedRating ?? 0}
                      </p>
                    </div>
                  </div>
                ))}

                {/* ✅ Modern Footer for Totals */}
                <div className="flex justify-end pt-6">
                  <div className="flex space-x-6 bg-white rounded-xl shadow-md px-6 py-4 border border-gray-200">
                    {/* Total Score */}
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wide">
                        Total Score:
                      </span>
                      <span className="text-indigo-700 text-xl font-bold">
                        {totalScore}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px bg-gray-300"></div>

                    {/* Total Weighted Rating */}
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600 font-semibold text-sm uppercase tracking-wide">
                        Weighted Rating:
                      </span>
                      <span className="text-purple-700 text-xl font-bold">
                        {totalWeightedRating.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              {viewMode === "Monthly" && (
                <div className="mt-8">
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-6 md:p-8 border border-gray-200">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      Monthly Summary
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {/* Monthly Average */}
                      <div className="relative flex flex-col items-center justify-center bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition overflow-visible">
                        <div className="text-gray-800 text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
                          Monthly Avg
                        </div>
                        <div className="text-pink-600 text-2xl md:text-3xl font-semibold">
                          {monthlyAverage != null &&
                          !isNaN(Number(monthlyAverage))
                            ? Number(monthlyAverage).toFixed(2)
                            : "N/A"}
                        </div>
                        <div className="absolute -top-2 right-2 h-7 w-7 flex items-center justify-center bg-pink-100 text-pink-600 rounded-full text-sm shadow-md">
                          📈
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="relative flex flex-col items-center justify-center bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition overflow-visible">
                        <div className="text-gray-800 text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
                          Performance
                        </div>
                        <div className="text-emerald-700 text-2xl md:text-3xl font-semibold">
                          {performance || "N/A"}
                        </div>
                        <div className="absolute -top-2 right-2 h-7 w-7 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full text-sm shadow-md">
                          🚀
                        </div>
                      </div>

                      {/* Action */}
                      <div className="relative flex flex-col items-center justify-center bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition overflow-visible">
                        <div className="text-gray-800 text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
                          Action
                        </div>

                        <div className="text-indigo-700 text-2xl md:text-3xl font-semibold">
                          {Action || "N/A"}
                        </div>

                        <div
                          className="absolute -top-2 right-2 h-8 w-8 flex items-center justify-center 
                   bg-indigo-100 text-indigo-600 rounded-full text-lg shadow-md"
                          aria-hidden
                        >
                          {Action === "Urgent Meeting" && "🚨"}
                          {Action === "Hr Meeting" && "🧑‍💼"}
                          {Action === "Motivate" && "💪"}
                          {Action === "Nothing" && "🙂"}
                          {Action === "Bonus" && "🎉"}
                        </div>
                      </div>

                      {/* Eligible for Increment */}
                      <div className="relative flex flex-col items-center justify-center bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition overflow-visible">
                        <div className="text-gray-800 text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
                          Increment
                        </div>

                        {/* Use computed incrementDisplay (prefers API value, falls back to monthlyAverage logic) */}
                        <div className="text-green-700 text-2xl md:text-3xl font-semibold">
                          {incrementDisplay}
                        </div>

                        <div
                          className="absolute -top-2 right-2 h-8 w-8 flex items-center justify-center 
                   bg-green-100 text-green-600 rounded-full text-lg shadow-md"
                          aria-hidden
                        >
                          {incrementIcon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
