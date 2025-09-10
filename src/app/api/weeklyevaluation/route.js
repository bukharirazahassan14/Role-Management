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
// ✅ POST - create a new weekly evaluation
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    // fetch all evaluation programs (to get weightages)
    const programs = await EvaluationProgram.find().lean();
    const weightageMap = Object.fromEntries(programs.map(p => [p._id.toString(), p.Weightage]));

    // calculate weighted ratings
    let totalScore = 0;
    let totalWeightedRating = 0;
    const scores = body.scores.map(s => {
      const weightage = weightageMap[s.kpiId] || 0;
      const weightedRating = (s.score * weightage) / 100;
      totalScore += s.score;
      totalWeightedRating += weightedRating;

      return {
        kpiId: s.kpiId,
        score: s.score,
        weightage,
        weightedRating,
      };
    });

    const newEvaluation = new WeeklyEvaluation({
      userId: body.userId,
      weekNumber: body.weekNumber,
      weekStart: body.weekStart,
      weekEnd: body.weekEnd,
      scores,
      comments: body.comments,
      totalScore,
      totalWeightedRating,
      evaluatedBy: body.evaluatedBy,
    });

    const saved = await newEvaluation.save();

    return new Response(
      JSON.stringify({ message: "Weekly evaluation created", id: saved._id.toString() }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating evaluation:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
