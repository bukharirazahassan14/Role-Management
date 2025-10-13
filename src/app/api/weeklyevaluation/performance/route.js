import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const fromDate = startDateParam
      ? new Date(startDateParam)
      : new Date("1970-01-01");
    const toDate = endDateParam
      ? new Date(endDateParam + "T23:59:59")
      : new Date();

    const results = await User.aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },

         // ✅ Role filtering added here
      {
        $match: {
          "roleInfo.name": { $in: ["HR", "Staff", "Temp Staff"] },
        },
      },
      
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
                weekEnd: { $gte: fromDate, $lte: toDate },
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
                  $cond: {
                    if: { $eq: ["$weeksCount", 0] },
                    then: 0,
                    else: {
                      $divide: ["$totalWeightedRatingSum", 4],
                    },
                  },
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
        },
      },
    ]);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching performance:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
