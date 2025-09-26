import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year"));
    const monthsParam = searchParams.get("months"); // e.g. "9,11"

    if (!year || !monthsParam) {
      return NextResponse.json(
        { error: "Missing required parameters: year or months" },
        { status: 400 }
      );
    }

    // ✅ Parse months into an array of numbers
    const selectedMonths = monthsParam
      .split(",")
      .map(m => Number(m.trim()))
      .filter(m => !isNaN(m));

    if (selectedMonths.length === 0) {
      return NextResponse.json(
        { error: "Invalid months provided" },
        { status: 400 }
      );
    }

    // ✅ Run aggregation
    const result = await WeeklyEvaluation.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$weekStart" }, year] },
              { $in: [{ $month: "$weekStart" }, selectedMonths] }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $unwind: "$scores" },
      {
        $group: {
          _id: "$scores.kpiId",
          totalScore: { $sum: "$scores.score" },
          totalWeightedRating: { $sum: "$scores.weightedRating" },
          weightage: { $first: "$scores.weightage" },
          firstWeekStart: { $min: "$weekStart" },
          lastWeekEnd: { $max: "$weekEnd" },
          firstName: { $first: "$user.firstName" },
          lastName: { $first: "$user.lastName" },
          primaryEmail: { $first: "$user.primaryEmail" }
        }
      },
      {
        $group: {
          _id: null,
          scores: {
            $push: {
              kpiId: "$_id",
              score: "$totalScore",
              weightedRating: "$totalWeightedRating",
              weightage: "$weightage"
            }
          },
          totalScore: { $sum: "$totalScore" },
          totalWeightedRating: { $sum: "$totalWeightedRating" },
          totalWeightage: { $sum: "$weightage" },
          monthStart: { $min: "$firstWeekStart" },
          monthEnd: { $max: "$lastWeekEnd" },
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          primaryEmail: { $first: "$primaryEmail" }
        }
      },
      {
        $addFields: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          // ✅ Dynamic monthly average
          monthlyAverage: {
            $divide: [
              "$totalWeightedRating",
              { $multiply: [selectedMonths.length, 4] } // months × 4 weeks
            ]
          }
        }
      }
    ]);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("❌ Aggregation Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
