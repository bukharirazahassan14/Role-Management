//src/app/api/weeklyevaluation/evaluationprograms/route.js
import connectToDB from "@/lib/mongodb";
import EvaluationProgram from "@/models/EvaluationProgram";

export async function GET() {
  try {
    await connectToDB();
    const programs = await EvaluationProgram.find().sort({ createdAt: 1 }).lean();
    return new Response(JSON.stringify(programs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching evaluation programs:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
