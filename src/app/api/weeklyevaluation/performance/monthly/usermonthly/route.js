//api/weeklyevaluation/performance/monthly/usermonthly/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";             // ✅ needed for ObjectId
import User from "@/models/User";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month"));
    const userIdParam = searchParams.get("userId"); // ✅ get userId from query

    // Optional: handle week numbers like week=1,2,3
    const weekParam = searchParams.get("week");
    const weeks =
      weekParam && weekParam.trim().length > 0
        ? weekParam.split(",").map((w) => parseInt(w.trim()))
        : null;

    if (!year || !month) {
      return new Response(
        JSON.stringify({ error: "Year and month are required" }),
        { status: 400 }
      );
    }

    // ✅ Compute start and end of month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // ✅ Weekly evaluation match condition
    const matchCondition = {
      weekEnd: { $gte: startOfMonth, $lte: endOfMonth },
    };
    if (weeks && weeks.length > 0) {
      matchCondition.weekNumber = { $in: weeks };
    }

    // ✅ User match condition
    const userMatch = {};
    if (userIdParam) {
      userMatch._id =
        userIdParam.length === 24
          ? new mongoose.Types.ObjectId(userIdParam)
          : userIdParam;
    }

    const results = await User.aggregate([
      // ✅ Filter by userId if provided
      { $match: userMatch },

      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          roleName: "$roleInfo.name",
        },
      },
      {
        $lookup: {
          from: "weeklyevaluations",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                ...matchCondition,
              },
            },
            {
              $group: {
                _id: null,
                weekNumbers: { $push: "$weekNumber" },
                weeksCount: { $sum: 1 },
                latestWeekStart: { $min: "$weekStart" },
                latestWeekEnd: { $max: "$weekEnd" },
                totalScoreSum: { $sum: "$totalScore" },
                totalWeightedRatingSum: { $sum: "$totalWeightedRating" },
              },
            },
            {
              $addFields: {
                avgWeightedRating: {
                  $cond: [
                    { $eq: ["$weeksCount", 0] },
                    0,
                    { $divide: ["$totalWeightedRatingSum", 4] },
                  ],
                },
              },
            },
          ],
          as: "evaluations",
        },
      },
      { $unwind: { path: "$evaluations", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          fullName: 1,
          roleName: 1,
          weekNumbers: { $ifNull: ["$evaluations.weekNumbers", []] },
          weekStart: "$evaluations.latestWeekStart",
          weekEnd: "$evaluations.latestWeekEnd",
          totalScoreSum: { $ifNull: ["$evaluations.totalScoreSum", 0] },
          totalWeightedRatingSum: {
            $ifNull: ["$evaluations.totalWeightedRatingSum", 0],
          },
          avgWeightedRating: { $ifNull: ["$evaluations.avgWeightedRating", 0] },
          performance: {
            $cond: {
              if: {
                $eq: [
                  { $size: { $ifNull: ["$evaluations.weekNumbers", []] } },
                  0,
                ],
              },
              then: "",
              else: {
                $switch: {
                  branches: [
                    { case: { $lte: ["$evaluations.avgWeightedRating", 1] }, then: "Poor" },
                    { case: { $lte: ["$evaluations.avgWeightedRating", 2] }, then: "Partial" },
                    { case: { $lte: ["$evaluations.avgWeightedRating", 3] }, then: "Normal" },
                    { case: { $lte: ["$evaluations.avgWeightedRating", 4] }, then: "Good" },
                    { case: { $gt: ["$evaluations.avgWeightedRating", 4] }, then: "Excellent" },
                  ],
                  default: "Unknown",
                },
              },
            },
          },
        },
      },
    ]);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching monthly performance:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
