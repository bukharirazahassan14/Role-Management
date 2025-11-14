//api/weeklyevaluation/performance/monthly/TeamPerformanceMetrics/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);

    const year = parseInt(searchParams.get("year"), 10);
    const monthParam =
      searchParams.get("months") ?? searchParams.get("month") ?? null;
    const weekParam =
      searchParams.get("weeks") ?? searchParams.get("week") ?? null;

    const months =
      monthParam && monthParam.trim().length > 0
        ? monthParam
            .split(",")
            .map((m) => parseInt(m.trim(), 10))
            .filter((m) => !isNaN(m) && m >= 1 && m <= 12)
        : [];

    const weeks =
      weekParam && weekParam.trim().length > 0
        ? weekParam
            .split(",")
            .map((w) => parseInt(w.trim(), 10))
            .filter((w) => !isNaN(w))
        : null;

    if (!year || months.length === 0) {
      return new Response(
        JSON.stringify({ error: "Year and at least one month are required" }),
        { status: 400 }
      );
    }

    // Date ranges per selected month
    const monthDateRanges = months.map((m) => ({
      start: new Date(year, m - 1, 1),
      end: new Date(year, m, 0, 23, 59, 59),
    }));

    const monthConditions = monthDateRanges.map((r) => ({
      weekEnd: { $gte: r.start, $lte: r.end },
    }));

    const matchCondition = { $or: monthConditions };
    if (weeks && weeks.length > 0) {
      matchCondition.weekNumber = { $in: weeks };
    }

    // Determine latest month end (for user joiningDate filter)
    const userJoiningDateFilter = new Date(
        Math.max(...monthDateRanges.map((r) => r.end.getTime()))
    );

    const results = await User.aggregate([
      // --- Stage 1: Get Role Info ---
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },

      // --- Stage 2: Initial User Filtering (Role and Join Date) ---
      {
        $match: {
          "roleInfo.name": { $nin: ["Super Admin"] },
          joiningDate: { $lte: userJoiningDateFilter },
          // Removed Access Control filters as requested earlier.
        },
      },

      // --- Stage 3: Project Initial User Fields ---
      {
        $project: {
          _id: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          roleName: "$roleInfo.name",
          roleDescription: "$roleInfo.description",
        },
      },

      // --- Stage 4: Get Evaluations (Sub-Pipeline) ---
      {
        $lookup: {
          from: "weeklyevaluations",
          let: { userId: "$_id" },
          pipeline: [
            // Sub-Stage 4.1: Match Evaluations by User ID and Time Range
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                ...matchCondition,
              },
            },
            // Sub-Stage 4.2: Group by Month (to get monthly stats)
            {
              $group: {
                _id: { month: { $month: "$weekEnd" } },
                weekNumbers: { $push: "$weekNumber" },
                totalWeightedRatingMonth: { $sum: "$totalWeightedRating" },
                totalScoreMonth: { $sum: "$totalScore" },
                weeksCountMonth: { $sum: 1 },
                minWeekStart: { $min: "$weekStart" },
                maxWeekEnd: { $max: "$weekEnd" },
              },
            },
            // Sub-Stage 4.3: Group across all selected months (Final Aggregation)
            {
              $group: {
                _id: null,
                activeMonthsCount: { $sum: 1 },
                weekNumbers: { $push: "$weekNumbers" },
                totalWeightedRatingSum: { $sum: "$totalWeightedRatingMonth" },
                totalScoreSum: { $sum: "$totalScoreMonth" },
                latestWeekStart: { $min: "$minWeekStart" },
                latestWeekEnd: { $max: "$maxWeekEnd" },
              },
            },
            // Sub-Stage 4.4: Calculate Final Average
            {
              $addFields: {
                weekNumbers: {
                  $reduce: {
                    input: "$weekNumbers",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] },
                  },
                },
                avgWeightedRating: {
                  $cond: [
                    { $eq: ["$activeMonthsCount", 0] },
                    0,
                    {
                      $divide: [
                        "$totalWeightedRatingSum",
                        { $multiply: ["$activeMonthsCount", 4] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "evaluations",
        },
      },

      // --- Stage 5: Unwind Evaluations ---
      { $unwind: { path: "$evaluations", preserveNullAndEmptyArrays: true } },
      
      // 🛑 Stage 6: Filter Out Users with No Evaluation Data (FIXED)
      {
        $match: {
            // Only include users who have a calculated weighted rating sum greater than 0
            // (i.e., they had at least one evaluation in the selected period)
            "evaluations.totalWeightedRatingSum": { $gt: 0 } 
        }
      },

      // --- Stage 7: Final Projection and Performance Classification ---
      {
        $project: {
          _id: 1,
          fullName: 1,
          roleName: 1,
          roleDescription: 1,
          weekNumbers: { $ifNull: ["$evaluations.weekNumbers", []] },
          // Default to null if missing
          weekStart: { $ifNull: ["$evaluations.latestWeekStart", null] },
          weekEnd: { $ifNull: ["$evaluations.latestWeekEnd", null] },
          activeMonthsCount: { $ifNull: ["$evaluations.activeMonthsCount", 0] },
          totalScoreSum: { $ifNull: ["$evaluations.totalScoreSum", 0] },
          totalWeightedRatingSum: {
            $ifNull: ["$evaluations.totalWeightedRatingSum", 0],
          },
          avgWeightedRating: { $ifNull: ["$evaluations.avgWeightedRating", 0] },

          // Performance Classification (N/A checks no longer needed due to Stage 6)
          performance: {
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
          
          // Action Classification
          Action: {
            $switch: {
              branches: [
                { case: { $lte: ["$evaluations.avgWeightedRating", 1] }, then: "Urgent Meeting" },
                { case: { $lte: ["$evaluations.avgWeightedRating", 2] }, then: "Hr Meeting" },
                { case: { $lte: ["$evaluations.avgWeightedRating", 3] }, then: "Motivate" },
                { case: { $lte: ["$evaluations.avgWeightedRating", 4] }, then: "Nothing" },
                { case: { $lte: ["$evaluations.avgWeightedRating", 5] }, then: "Bonus" },
              ],
              default: "None",
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}