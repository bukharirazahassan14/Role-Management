import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function DELETE(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year = parseInt(searchParams.get("year"), 10);
    const month = parseInt(searchParams.get("month"), 10);

    if (!userId || !year || !month) {
      return new Response(
        JSON.stringify({ error: "Missing userId, year, or month" }),
        { status: 400 }
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // ✅ Delete the last record (highest weekNumber)
    const deletedDoc = await WeeklyEvaluation.findOneAndDelete(
      {
        userId,
        weekStart: { $gte: startDate, $lte: endDate },
      },
      { sort: { weekNumber: -1 } }
    );

    if (!deletedDoc) {
      return new Response(
        JSON.stringify({ message: "No evaluation found for this user in given month" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(deletedDoc), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error deleting evaluation:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
