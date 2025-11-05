//src/app/api/weeklyevaluation/evaluationprograms/route.js
import connectToDB from "@/lib/mongodb";
import EvaluationProgram from "@/models/EvaluationProgram";

export async function DELETE(req, { params }) {
  try {
    await connectToDB();
    const { id } = params;

    const deleted = await EvaluationProgram.findByIdAndDelete(id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Program not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Program deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Delete API Error:", err);
    return new Response(
      JSON.stringify({ error: "Server error while deleting" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
