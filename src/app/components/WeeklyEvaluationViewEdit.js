"use client";
import { use, useEffect, useState, useCallback, useRef } from "react";
import { ClipboardList } from "lucide-react";

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

  // ✅ Fetch evaluation record for selected weeks
  const fetchEvaluationRecord = useCallback(
    async (weeksArray, programs = evaluationPrograms) => {
      try {
        const query = new URLSearchParams({ userId, year, month });
        query.append("weekNumbers", weeksArray.join(","));

        const res = await fetch(`/api/weeklyevaluation/overview?${query}`);
        if (!res.ok) throw new Error("Failed to fetch evaluation");

        const data = await res.json();

        

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
    let updated = [];
    if (selectedWeek.includes(week)) {
      updated = selectedWeek.filter((w) => w !== week);
      if (updated.length === 0) updated = [1, 2, 3, 4]; // fallback
    } else {
      updated = [...selectedWeek, week];
    }
    setSelectedWeek(updated);
    fetchEvaluationRecord(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <span className="p-2 bg-indigo-100 rounded-xl shadow-sm">
            <ClipboardList className="w-8 h-8 text-indigo-600" />
          </span>
          Weekly Evaluation Overview
        </h1>

        {/* Week Selector */}
        <div className="flex justify-center space-x-3 mt-4">
          {weeks.map((week) => {
            const isSelected = selectedWeek.includes(week);
            return (
              <button
                key={week}
                type="button"
                onClick={() => handleWeekClick(week)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-xs font-medium transition transform shadow-md ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-110"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {week}
              </button>
            );
          })}
        </div>
      </div>

      {/* User & General Info */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex items-center space-x-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow">
              {user.firstName[0]}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.primaryEmail}</p>
            </div>
          </div>
        )}

        {/* General Info */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
  <h2 className="text-lg font-semibold text-gray-700 mb-3">
    📌 General Info
  </h2>
  <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-sm">
    <p>
      <span className="font-medium">Year:</span> {year}
    </p>
    <p>
      <span className="font-medium">Month:</span> {month}
    </p>
    <p>
      <span className="font-medium">Week Number:</span>{" "}
      {selectedWeek.join(", ")}
    </p>
    <p>
      <span className="font-medium">Week Start:</span>{" "}
      {weekStart
        ? new Date(weekStart).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "N/A"}
    </p>
    <p>
      <span className="font-medium">Week End:</span>{" "}
      {weekEnd
        ? new Date(weekEnd).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "N/A"}
    </p>
  </div>
</div>

      </div>

      {/* Evaluation Programs */}
      <div className="mt-10 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            📝 Evaluation Programs & Scores
          </h2>

          {evaluationPrograms.length === 0 ? (
            <p className="text-gray-500 text-center">No programs found.</p>
          ) : (
            <div>
              <div className="divide-y divide-gray-100">
                {evaluationPrograms.map((program, idx) => (
                  <div
                    key={program._id}
                    className="py-4 flex justify-between items-start"
                  >
                    <div className="max-w-md">
                      <p className="font-medium text-gray-800">
                        {program.Name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {program.Description}
                      </p>
                      <p className="text-xs text-indigo-500 mt-1 font-medium">
                        Weightage: {program.Weightage}%
                      </p>
                    </div>
                    <div className="text-right">
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
              </div>

              {/* Totals */}
              <div className="mt-6 border-t pt-4 flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-800">Total</p>
                <div className="text-right">
                  <p className="text-indigo-600 font-bold">
                    Total Score:{" "}
                    {evaluationScores
                      .reduce((sum, s) => sum + Number(s.score || 0), 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-gray-700 font-medium">
                    Total Weighted Rating:{" "}
                    {evaluationScores
                      .reduce(
                        (sum, s) => sum + Number(s.weightedRating || 0),
                        0
                      )
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
}
