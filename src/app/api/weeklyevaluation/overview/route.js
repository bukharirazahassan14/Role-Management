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

    const result = {
      userId,
      user: {
        fullName: userRes?.fullName || "",
        email: userRes?.email || "",
      },
      weeks: weekNumbers,
      weekStart: evaluations[0].weekStart || null,
      weekEnd: evaluations[0].weekEnd || null,
      scores: evaluations[0].scores,
      totalScore: evaluations[0].totalScore,
      totalWeightage: evaluations[0].totalWeightage,
      totalWeightedRating: evaluations[0].totalWeightedRating,
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
