"use client";
import { use, useEffect, useState } from "react";

export default function WeeklyEvaluationViewEdit({ searchParams }) {
  const params = use(searchParams);
  const { userId, year, month, weekNumber } = params || {};

  const [user, setUser] = useState(null);
  const [evaluationPrograms, setEvaluationPrograms] = useState([]);
  const [evaluationScores, setEvaluationScores] = useState([]);
 const [selectedWeek, setSelectedWeek] = useState(Number(weekNumber) || 1);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const weeks = [1, 2, 3, 4];

  // ✅ Fetch User Info (fallback using /basic)
  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`); // 👈 hit the single-user route
      if (!res.ok) throw new Error("Failed to fetch user");

      const data = await res.json();
      setUser(data); // already formatted by API
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    }
  };

  // ✅ Fetch Evaluation Programs
  const fetchEvaluationPrograms = async () => {
    try {
      const res = await fetch("/api/weeklyevaluation/evaluationprograms");
      if (!res.ok) throw new Error("Failed to fetch evaluation programs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvaluationPrograms(data);
        setEvaluationScores(
          data.map(() => ({ score: "", weightedRating: "" }))
        );
      }
    } catch (err) {
      console.error("❌ Failed to fetch evaluation programs:", err);
    }
  };

  // ✅ Fetch Evaluation Record

  // Fetch Evaluation Record
  const fetchEvaluationRecord = async (weekNum) => {
    try {
      const query = new URLSearchParams({
        userId,
        year,
        month,
        weekNumber: weekNum,
      }).toString();
      const res = await fetch(`/api/weeklyevaluation/${userId}?${query}`);
      if (res.status === 404) return;
      if (!res.ok) throw new Error("Failed to fetch evaluation");

      const data = await res.json();
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
    } catch (err) {
      console.error("❌ Failed to fetch evaluation record:", err);
    }
  };

  // Handler for week selection
  const handleWeekSelect = (week) => {
    setLoading(true);
    fetchEvaluationRecord(week).finally(() => setLoading(false));
  };

  // Initial fetch
  useEffect(() => {
    if (userId && year && month && weekNumber) {
      fetchUser();
      fetchEvaluationPrograms().then(() => fetchEvaluationRecord(selectedWeek));
    }
  }, [userId, year, month, weekNumber]);

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
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          📊 Weekly Evaluation Overview
        </h1>

        {/* Week Selector Circles */}
        <div className="flex justify-center space-x-4 mt-4">
          {weeks.map((week) => {
            const isSelected = selectedWeek === week;

            return (
              <button
                key={week}
                type="button"
                 onClick={() => handleWeekSelect(week)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium shadow-lg transition
          ${
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
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* User Info */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex items-center space-x-5 w-full">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow">
              {user.firstName[0]}
            </div>

            {/* Name & Email */}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.primaryEmail}</p>
            </div>
          </div>
        )}

        {/* General Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 w-full">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            📌 General Info
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700 text-sm">
            <p>
              <span className="font-medium">Year:</span> {year}
            </p>
            <p>
              <span className="font-medium">Month:</span> {month}
            </p>
            <p>
              <span className="font-medium">Week Number:</span> {selectedWeek}
            </p>
            <p>
              <span className="font-medium">Week Start:</span> {weekStart}
            </p>
            <p>
              <span className="font-medium">Week End:</span> {weekEnd}
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Programs */}
      <div className="mt-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            📝 Evaluation Programs & Scores
          </h2>

          {evaluationPrograms.length === 0 ? (
            <p className="text-gray-500">No programs found.</p>
          ) : (
            <div>
              <div className="divide-y divide-gray-100">
                {evaluationPrograms.map((program, idx) => (
                  <div
                    key={program._id}
                    className="py-4 flex justify-between items-center"
                  >
                    {/* Program Info */}
                    <div>
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

                    {/* Scores */}
                    <div className="text-right">
                      <p className="text-indigo-600 font-semibold">
                        Score: {evaluationScores[idx]?.score ?? "N/A"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Weighted Rating:{" "}
                        {evaluationScores[idx]?.weightedRating ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Row */}
              <div className="mt-6 border-t pt-4 flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-800">Total</p>
                <div className="text-right">
                  <p className="text-indigo-600 font-bold">
                    Total Score:{" "}
                    {evaluationScores.reduce(
                      (sum, s) => sum + (Number(s.score) || 0),
                      0
                    )}
                  </p>
                  <p className="text-gray-700 font-medium">
                    Total Weighted Rating:{" "}
                    {evaluationScores.reduce(
                      (sum, s) => sum + (Number(s.weightedRating) || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="mt-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            💬 Comments
          </h2>
          <p className="text-gray-600">
            {comments || "No comments available."}
          </p>
        </div>
      </div>
    </div>
  );
}
