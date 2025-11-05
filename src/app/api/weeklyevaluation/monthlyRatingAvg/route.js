//app/api/weeklyevaluation/monthlyRatingAvg/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const yearParam = searchParams.get("year");

    if (!userIdParam || !yearParam) {
      return new Response(
        JSON.stringify({ error: "userId and year are required" }),
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(userIdParam);
    const selectedYear = parseInt(yearParam, 10);
    const FIXED_WEEKS = 4;

    const results = await WeeklyEvaluation.aggregate([
      { $group: { _id: null } },
      { $project: { months: [1,2,3,4,5,6,7,8,9,10,11,12] } },
      { $unwind: "$months" },
      { $project: { month: "$months" } },

      {
        $lookup: {
          from: "weeklyevaluations",
          let: { m: "$month" },
          pipeline: [
            {
              $match: {
                userId: userId,
                $expr: {
                  $and: [
                    { $eq: [ { $year: "$weekStart" }, selectedYear ] },
                    { $eq: [ { $month: "$weekStart" }, "$$m" ] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                sumTotal: { $sum: "$totalWeightedRating" }
              }
            }
          ],
          as: "monthData"
        }
      },

      {
        $addFields: {
          sumTotal: { $ifNull: [ { $first: "$monthData.sumTotal" }, 0 ] }
        }
      },
      {
        $addFields: {
          rating: { $round: [ { $divide: [ "$sumTotal", FIXED_WEEKS ] }, 2 ] }
        }
      },

      { $sort: { month: 1 } },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
              { $subtract: ["$month", 1] }
            ]
          }
        }
      },

      // ✅ Final output: only month & rating
      { $project: { _id: 0, month: 1, rating: 1 } }
    ]);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error fetching monthly performance:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
