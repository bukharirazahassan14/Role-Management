//api/dashboard/weeklysummary/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const passedWeekNumber = searchParams.get("weekNumber");
    const passedMonth = searchParams.get("month");
    const passedYear = searchParams.get("year");

    const weekNumber = passedWeekNumber ? parseInt(passedWeekNumber) : 1;
    const month = passedMonth ? parseInt(passedMonth) : new Date().getMonth() + 1;
    const year = passedYear ? parseInt(passedYear) : new Date().getFullYear();

    const userAccessCollection = mongoose.connection.db.collection("useraccesscontrol");

    const results = await userAccessCollection.aggregate([
      // 1️⃣ Only users with applyKpi = true
      {
        $match: {
          "formAccess.partialAccess.permissions.applyKpi": true
        }
      },

      // 2️⃣ Join with users collection
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // 3️⃣ Join with weeklyevaluations filtered by weekNumber/month/year
      {
        $lookup: {
          from: "weeklyevaluations",
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$weekNumber", weekNumber] },
                    { $eq: [{ $month: "$weekStart" }, month] },
                    { $eq: [{ $year: "$weekStart" }, year] }
                  ]
                }
              }
            }
          ],
          as: "evaluations"
        }
      },

      // 4️⃣ Calculate totalScore and totalWeightedRating
      {
        $addFields: {
          totalScore: { $sum: "$evaluations.totalScore" },
          totalWeightedRating: { $sum: "$evaluations.totalWeightedRating" }
        }
      },

      // 5️⃣ Filter users with evaluations
      {
        $match: {
          totalScore: { $gt: 0 }
        }
      },

      // 6️⃣ Add Action field based on totalWeightedRating
      {
        $addFields: {
          Action: {
            $switch: {
              branches: [
                { case: { $lte: ["$totalWeightedRating", 1] }, then: "Urgent Meeting" },
                { case: { $lte: ["$totalWeightedRating", 2] }, then: "Hr Meeting" },
                { case: { $lte: ["$totalWeightedRating", 3] }, then: "Motivate" },
                { case: { $lte: ["$totalWeightedRating", 4] }, then: "Nothing" },
                { case: { $lte: ["$totalWeightedRating", 5] }, then: "Bonus" }
              ],
              default: "None"
            }
          }
        }
      },

       // 7️⃣ Sort by totalWeightedRating (descending)
      {
        $sort: { totalWeightedRating: -1 }
      },

      // 7️⃣ Final output
      {
        $project: {
          _id: 0,
          userId: 1,
          fullName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          totalScore: 1,
          totalWeightedRating: 1,
          weekNumber: weekNumber,
          month: month,
          year: year,
          Action: 1
        }
      }
    ]).toArray();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
