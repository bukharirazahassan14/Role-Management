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

    // ✅ Determine latest month end (for user joiningDate filter)
    const lastMonthEnd = monthDateRanges[monthDateRanges.length - 1].end;

    const results = await User.aggregate([
      // --- Get Role Info ---
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },

      // ✅ Only HR, Staff, Temp Staff users
      {
        $match: {
           "roleInfo.name": { $nin: ["Super Admin"] },
          // ✅ Always take the latest selected month’s end date
          joiningDate: {
            $lte: new Date(
              Math.max(...monthDateRanges.map((r) => r.end.getTime()))
            ),
          },
        },
      },

      {
        $project: {
          _id: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          roleName: "$roleInfo.name",
          roleDescription: "$roleInfo.description",
        },
      },

      // --- Get Evaluations ---
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
            // Group by month to collect week numbers and stats
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
            // Then group all months back together
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
            // ✅ Flatten weekNumbers
            {
              $addFields: {
                weekNumbers: {
                  $reduce: {
                    input: "$weekNumbers",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] },
                  },
                },
              },
            },
            // ✅ Compute averages and divisor
            {
              $addFields: {
                divisor: { $multiply: ["$activeMonthsCount", 4] },
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

      { $unwind: { path: "$evaluations", preserveNullAndEmptyArrays: true } },

      // --- Final Projection ---
      {
        $project: {
          _id: 1,
          fullName: 1,
          roleName: 1,
          roleDescription: 1,
          weekNumbers: { $ifNull: ["$evaluations.weekNumbers", []] },
          weekStart: "$evaluations.latestWeekStart",
          weekEnd: "$evaluations.latestWeekEnd",
          activeMonthsCount: { $ifNull: ["$evaluations.activeMonthsCount", 0] },
          totalScoreSum: { $ifNull: ["$evaluations.totalScoreSum", 0] },
          totalWeightedRatingSum: {
            $ifNull: ["$evaluations.totalWeightedRatingSum", 0],
          },
          avgWeightedRating: { $ifNull: ["$evaluations.avgWeightedRating", 0] },
          performance: {
            $cond: {
              if: { $lte: ["$evaluations.avgWeightedRating", 0] },
              then: "",
              else: {
                $switch: {
                  branches: [
                    {
                      case: { $lte: ["$evaluations.avgWeightedRating", 1] },
                      then: "Poor",
                    },
                    {
                      case: { $lte: ["$evaluations.avgWeightedRating", 2] },
                      then: "Partial",
                    },
                    {
                      case: { $lte: ["$evaluations.avgWeightedRating", 3] },
                      then: "Normal",
                    },
                    {
                      case: { $lte: ["$evaluations.avgWeightedRating", 4] },
                      then: "Good",
                    },
                    {
                      case: { $gt: ["$evaluations.avgWeightedRating", 4] },
                      then: "Excellent",
                    },
                  ],
                  default: "Unknown",
                },
              },
            },
          },

          // ✅ Added Action logic
          Action: {
            $switch: {
              branches: [
                {
                  case: { $lte: ["$evaluations.avgWeightedRating", 1] },
                  then: "Urgent Meeting",
                },
                {
                  case: { $lte: ["$evaluations.avgWeightedRating", 2] },
                  then: "Hr Meeting",
                },
                {
                  case: { $lte: ["$evaluations.avgWeightedRating", 3] },
                  then: "Motivate",
                },
                {
                  case: { $lte: ["$evaluations.avgWeightedRating", 4] },
                  then: "Nothing",
                },
                {
                  case: { $lte: ["$evaluations.avgWeightedRating", 5] },
                  then: "Bonus",
                },
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
