import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year"));
    const monthsParam = searchParams.get("months"); // e.g. "9"
    const userIdParam = searchParams.get("userId"); // 👈 NEW: get userId

    if (!year || !monthsParam) {
      return NextResponse.json(
        { error: "Missing required parameters: year or months" },
        { status: 400 }
      );
    }

    // ✅ Convert userId to ObjectId if present
    let userIdFilter = {};
    if (userIdParam) {
      userIdFilter.userId = mongoose.Types.ObjectId.createFromHexString(userIdParam);
    }

    // Parse selected months → [9]
    const selectedMonths = monthsParam
      .split(",")
      .map((m) => Number(m.trim()))
      .filter((m) => !isNaN(m));

    if (selectedMonths.length === 0) {
      return NextResponse.json(
        { error: "Invalid months provided" },
        { status: 400 }
      );
    }

    // ✅ Run your provided aggregation (UNCHANGED except first $match includes userIdFilter)
    const result = await WeeklyEvaluation.aggregate([
      {
        $match: {
          ...userIdFilter, // 👈 Add userId filter here
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
          _id: {
            kpiId: "$scores.kpiId",
            weekNumber: "$weekNumber"
          },
          score: { $sum: "$scores.score" },
          weightedRating: { $sum: "$scores.weightedRating" },
          weightage: { $first: "$scores.weightage" },
          weekStart: { $first: "$weekStart" },
          weekEnd: { $first: "$weekEnd" },
          firstName: { $first: "$user.firstName" },
          lastName: { $first: "$user.lastName" },
          primaryEmail: { $first: "$user.primaryEmail" }
        }
      },

      {
        $group: {
          _id: "$_id.kpiId",
          totalScore: { $sum: "$score" },
          totalWeightedRating: { $sum: "$weightedRating" },
          weightage: { $first: "$weightage" },
          firstWeekStart: { $min: "$weekStart" },
          lastWeekEnd: { $max: "$weekEnd" },
          weeksCovered: { $addToSet: "$_id.weekNumber" },
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          primaryEmail: { $first: "$primaryEmail" }
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
          weeksCovered: { $addToSet: "$weeksCovered" },
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          primaryEmail: { $first: "$primaryEmail" }
        }
      },

      {
        $addFields: {
          weeksCovered: {
            $reduce: {
              input: "$weeksCovered",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] }
            }
          }
        }
      },

      {
        $addFields: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          monthlyAverage: {
            $divide: [
              "$totalWeightedRating",
              { $multiply: [selectedMonths.length, 4] }
            ]
          }
        }
      },

      {
        $addFields: {
          performance: {
            $switch: {
              branches: [
                { case: { $lte: ["$monthlyAverage", 1] }, then: "Poor" },
                { case: { $lte: ["$monthlyAverage", 2] }, then: "Partial" },
                { case: { $lte: ["$monthlyAverage", 3] }, then: "Normal" },
                { case: { $lte: ["$monthlyAverage", 4] }, then: "Good" },
                { case: { $gt: ["$monthlyAverage", 4] }, then: "Excellent" }
              ],
              default: "N/A"
            }
          },
          Action: {
            $switch: {
              branches: [
                { case: { $lte: ["$monthlyAverage", 1] }, then: "Urgent Meeting" },
                { case: { $lte: ["$monthlyAverage", 2] }, then: "Hr Meeting" },
                { case: { $lte: ["$monthlyAverage", 3] }, then: "Motivate" },
                { case: { $lte: ["$monthlyAverage", 4] }, then: "Nothing" },
                { case: { $lte: ["$monthlyAverage", 5] }, then: "Bonus" }
              ],
              default: "N/A"
            }
          },
          Increment: {
            $switch: {
              branches: [
                { case: { $lte: ["$monthlyAverage", 1] }, then: "NO" },
                { case: { $lte: ["$monthlyAverage", 2] }, then: "NO" },
                { case: { $lte: ["$monthlyAverage", 3] }, then: "1%" },
                { case: { $lte: ["$monthlyAverage", 4] }, then: "1.5%" },
                { case: { $gt: ["$monthlyAverage", 4] }, then: "2%" }
              ],
              default: "NO"
            }
          }
        }
      },

      {
        $addFields: {
          weeksCovered: { $sortArray: { input: "$weeksCovered", sortBy: 1 } }
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
