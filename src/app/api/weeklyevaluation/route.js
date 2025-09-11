//src/app/api/weeklyevaluation/route.js

import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";
import EvaluationProgram from "@/models/EvaluationProgram";

// ✅ GET - fetch all weekly evaluations
export async function GET() {
  try {
    await connectToDB();

    const evaluations = await WeeklyEvaluation.find()
      .populate("userId", "firstName lastName primaryEmail")
      .populate("evaluatedBy", "firstName lastName primaryEmail")
      .populate("scores.kpiId", "Name Weightage")
      .lean();

    // 🔥 Add fullName field manually
    evaluations.forEach(ev => {
      if (ev.userId) {
        ev.userId.fullName = `${ev.userId.firstName || ""} ${ev.userId.lastName || ""}`.trim();
      }
      if (ev.evaluatedBy) {
        ev.evaluatedBy.fullName = `${ev.evaluatedBy.firstName || ""} ${ev.evaluatedBy.lastName || ""}`.trim();
      }
    });

    return new Response(JSON.stringify(evaluations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching evaluations:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
// ✅ POST - add new weekly evaluation
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    const newEvaluation = new WeeklyEvaluation({
      userId: body.userId,
      evaluatedBy: body.evaluatedBy, // 👈 from localStorage loginID
      weekNumber: body.weekNumber,   // 👈 required field
      weekStart: new Date(body.weekStart),
      weekEnd: new Date(body.weekEnd),
      scores: body.evaluationScores.map(s => ({
        kpiId: s._id,                // 👈 map _id to kpiId
        score: s.score,
        weightage: s.weightage,
        weightedRating: s.weightedRating,
      })),
      comments: body.comments,
      totalScore: body.totalScore,
      totalWeightedRating: body.totalWeightedRating,
    });

    const saved = await newEvaluation.save();

    return new Response(
      JSON.stringify({ message: "Evaluation saved", evaluation: saved }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error saving evaluation:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
