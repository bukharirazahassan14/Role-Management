import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";
import mongoose from "mongoose";


export async function GET(req, context) {
  try {
    await connectToDB();

    // ✅ get userId from URL
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // ✅ read query params: month & year
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month"), 10);
    const year = parseInt(searchParams.get("year"), 10);

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and Year query params are required" },
        { status: 400 }
      );
    }


    // ✅ Aggregation pipeline to count unique weeks for user in month & year
    const results = await WeeklyEvaluation.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(id),
          $expr: {
            $and: [
              { $eq: [{ $month: "$weekStart" }, month] },
              { $eq: [{ $year: "$weekStart" }, year] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          weekNumbers: { $addToSet: "$weekNumber" },
          weekCount: { $sum: 1 },
        },
      },
    ]);

    if (!results.length) {
      return NextResponse.json(
        { weekNumbers: [], weekCount: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        uniqueWeeks: results[0].weekNumbers,
        weekCount: results[0].weekCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching evaluation count:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}