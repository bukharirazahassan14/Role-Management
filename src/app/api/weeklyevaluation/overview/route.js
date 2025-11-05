import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    // Parse weekNumbers from query, e.g., "1,2"
    let weekNumbers = [];
    const weekNumbersParam = searchParams.get("weekNumbers");
    if (weekNumbersParam) {
      weekNumbers = weekNumbersParam
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => !isNaN(n));
    }
    if (weekNumbers.length === 0) weekNumbers = [1];

    if (!userId || !year || !month) {
      return NextResponse.json(
        { error: "Missing userId, year, or month" },
        { status: 400 }
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Find which weeks actually exist in DB
    const existing = await WeeklyEvaluation.find({
      userId: new mongoose.Types.ObjectId(userId),
      weekNumber: { $in: weekNumbers },
      weekStart: { $gte: startDate, $lte: endDate },
    })
      .select("weekNumber")
      .lean();

    const existingWeeks = existing.map((e) => e.weekNumber);

    // Aggregation pipeline for combined scores & week range
    const evaluations = await WeeklyEvaluation.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          weekNumber: { $in: weekNumbers },
          weekStart: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$scores" },
      {
        $group: {
          _id: "$scores.kpiId",
          totalScore: { $sum: "$scores.score" },
          totalWeightedRating: { $sum: "$scores.weightedRating" },
          weightage: { $first: "$scores.weightage" },
          firstWeekStart: { $min: "$weekStart" },
          lastWeekEnd: { $max: "$weekEnd" },
        },
      },
      {
        $group: {
          _id: null,
          scores: {
            $push: {
              kpiId: "$_id",
              score: "$totalScore",
              weightedRating: "$totalWeightedRating",
              weightage: "$weightage",
            },
          },
          totalScore: { $sum: "$totalScore" },
          totalWeightedRating: { $sum: "$totalWeightedRating" },
          totalWeightage: { $sum: "$weightage" },
          weekStart: { $min: "$firstWeekStart" },
          weekEnd: { $max: "$lastWeekEnd" },
        },
      },
    ]);

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        {
          foundWeeks: weekNumbers.map((w) => ({
            week: w,
            found: existingWeeks.includes(w),
          })),
          error: `Evaluation not found for userId=${userId}, year=${year}, month=${month}, weeks=${weekNumbers}`,
        },
        { status: 404 }
      );
    }

    // Fetch user info
    const userRes = await mongoose
      .model("User")
      .findById(userId, { fullName: 1, email: 1 })
      .lean();

    // Calculate performance
    const totalWeeks = existingWeeks.length;
    const avgWeightedRating =
      totalWeeks > 0 ? evaluations[0].totalWeightedRating / 4 : 0;

    let performance = "";
    if (totalWeeks > 0) {
      if (avgWeightedRating <= 1) performance = "Poor";
      else if (avgWeightedRating <= 2) performance = "Partial";
      else if (avgWeightedRating <= 3) performance = "Normal";
      else if (avgWeightedRating <= 4) performance = "Good";
      else if (avgWeightedRating > 4) performance = "Excellent";
      else performance = "Unknown";
    }

    // ✅ Monthly Average
    const monthlyAverage =
      totalWeeks > 0
        ? (evaluations[0].totalWeightedRating / 4).toFixed(2)
        : "0.00";

    // ✅ Action (like Excel IFS)
    let Action = "";
    const avg = parseFloat(monthlyAverage);

    if (avg <= 1) Action = "Urgent Meeting";
    else if (avg <= 2) Action = "Hr Meeting";
    else if (avg <= 3) Action = "Motivate";
    else if (avg <= 4) Action = "Nothing";
    else if (avg <= 5) Action = "Bonus";
    else Action = "Unknown";

    const result = {
      userId,
      user: {
        fullName: userRes?.fullName || "",
        email: userRes?.email || "",
      },
      weeks: weekNumbers,
      foundWeeks: weekNumbers.map((w) => ({
        week: w,
        found: existingWeeks.includes(w),
      })),
      weekStart: evaluations[0].weekStart || null,
      weekEnd: evaluations[0].weekEnd || null,
      scores: evaluations[0].scores,
      totalScore: evaluations[0].totalScore,
      totalWeightage: evaluations[0].totalWeightage,
      totalWeightedRating: evaluations[0].totalWeightedRating,
      performance,            // Existing field
      monthlyAverage,         // Computed monthly average
      Action,                 // ✅ New field like Excel IFS
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching evaluation:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
