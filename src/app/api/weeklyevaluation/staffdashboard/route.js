import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month"));

    if (!userId || !year || !month) {
      return new Response(
        JSON.stringify({ error: "userId, year and month are required" }),
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const currentYear = year;
    const currentMonth = month;

    const results = await User.aggregate([
      // 1️⃣ Match user
      { $match: { _id: objectId } },

      // 2️⃣ Join role
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleInfo"
        }
      },
      { $unwind: "$roleInfo" },

      // 3️⃣ Join evaluations for last 6 months
      {
        $lookup: {
          from: "weeklyevaluations",
          let: { uid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    {
                      $gte: [
                        "$weekStart",
                        new Date(currentYear, currentMonth - 6, 1)
                      ]
                    },
                    {
                      $lte: [
                        "$weekStart",
                        new Date(currentYear, currentMonth, 31)
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { weekNumber: -1 } }
          ],
          as: "evaluations"
        }
      },

      // 4️⃣ Compute currentMonthAvg
      {
        $addFields: {
          currentEvaluation: { $arrayElemAt: ["$evaluations", 0] },
          currentMonthAvg: {
            $let: {
              vars: {
                monthEvals: {
                  $filter: {
                    input: "$evaluations",
                    as: "ev",
                    cond: {
                      $and: [
                        { $eq: [{ $month: "$$ev.weekStart" }, currentMonth] },
                        { $eq: [{ $year: "$$ev.weekStart" }, currentYear] }
                      ]
                    }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $size: "$$monthEvals" }, 0] },
                  {
                    $divide: [
                      { $sum: "$$monthEvals.totalWeightedRating" },
                      4
                    ]
                  },
                  0.0
                ]
              }
            }
          }
        }
      },

      // 5️⃣ Build lastSixMonths
      {
        $addFields: {
          lastSixMonths: {
            $map: {
              input: [5, 4, 3, 2, 1, 0],
              as: "i",
              in: {
                month: {
                  $let: {
                    vars: { calcMonth: { $subtract: [currentMonth, "$$i"] } },
                    in: {
                      $cond: [
                        { $gt: ["$$calcMonth", 0] },
                        "$$calcMonth",
                        { $add: ["$$calcMonth", 12] }
                      ]
                    }
                  }
                },
                year: {
                  $let: {
                    vars: { calcMonth: { $subtract: [currentMonth, "$$i"] } },
                    in: {
                      $cond: [
                        { $gt: ["$$calcMonth", 0] },
                        currentYear,
                        { $subtract: [currentYear, 1] }
                      ]
                    }
                  }
                },
                avgRating: {
                  $let: {
                    vars: {
                      monthData: {
                        $filter: {
                          input: "$evaluations",
                          as: "ev",
                          cond: {
                            $and: [
                              {
                                $eq: [
                                  { $month: "$$ev.weekStart" },
                                  {
                                    $cond: [
                                      {
                                        $gt: [
                                          { $subtract: [currentMonth, "$$i"] },
                                          0
                                        ]
                                      },
                                      { $subtract: [currentMonth, "$$i"] },
                                      {
                                        $add: [
                                          { $subtract: [currentMonth, "$$i"] },
                                          12
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              },
                              {
                                $eq: [
                                  { $year: "$$ev.weekStart" },
                                  {
                                    $cond: [
                                      {
                                        $gt: [
                                          { $subtract: [currentMonth, "$$i"] },
                                          0
                                        ]
                                      },
                                      currentYear,
                                      { $subtract: [currentYear, 1] }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                    },
                    in: {
                      $cond: [
                        { $gt: [{ $size: "$$monthData" }, 0] },
                        {
                          $divide: [
                            { $sum: "$$monthData.totalWeightedRating" },
                            4
                          ]
                        },
                        0.0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },

      // 6️⃣ Performance rating
      {
        $addFields: {
          performance: {
            $switch: {
              branches: [
                { case: { $lte: ["$currentMonthAvg", 1] }, then: "Poor" },
                { case: { $lte: ["$currentMonthAvg", 2] }, then: "Partial" },
                { case: { $lte: ["$currentMonthAvg", 3] }, then: "Normal" },
                { case: { $lte: ["$currentMonthAvg", 4] }, then: "Good" },
                { case: { $lte: ["$currentMonthAvg", 5] }, then: "Excellent" }
              ],
              default: "N/A"
            }
          }
        }
      },

      // 7️⃣ Scoring rate per KPI (without % symbols)
      {
        $lookup: {
          from: "evaluationprograms",
          localField: "currentEvaluation.scores.kpiId",
          foreignField: "_id",
          as: "kpiDetails"
        }
      },
      {
        $addFields: {
          scoringRates: {
            $map: {
              input: "$currentEvaluation.scores",
              as: "sc",
              in: {
                $let: {
                  vars: {
                    kpi: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$kpiDetails",
                            as: "k",
                            cond: { $eq: ["$$k._id", "$$sc.kpiId"] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    name: "$$kpi.Name",
                    achieved: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$$sc.score", 5] },
                            "$$sc.weightage"
                          ]
                        },
                        2
                      ]
                    },
                    weightage: "$$sc.weightage"
                  }
                }
              }
            }
          }
        }
      },

      // 8️⃣ Final projection
      {
        $project: {
          _id: 0,
          primaryEmail: 1,
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
          jd: 1,
          roleName: "$roleInfo.name",
          roleDesc: "$roleInfo.description",
          currentWeekNumber: "$currentEvaluation.weekNumber",
          currentWeekRating: "$currentEvaluation.totalWeightedRating",
          currentMonthAvg: 1,
          performance: 1,
          lastSixMonths: 1,
          scoringRates: 1
        }
      }
    ]);

    return new Response(JSON.stringify(results[0] || {}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
}
