// app/api/PMSReport/allUsers/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextResponse } from "next/server"; // Use NextResponse for Next.js 13+ App Router

/**
 * @method GET
 * @description Fetches a list of active users (ID and Full Name), including a static 'All' option, 
 * inserted via MongoDB aggregation ($facet, $unionWith pattern).
 */
export async function GET() {
  try {
    await connectToDB();

    // -------------------------
    // 🚀 AGGREGATION for User List (including static "All")
    // -------------------------
    const userList = await User.aggregate([
      // Phase 1: Separate the user data and the static 'All' entry
      {
        $facet: {
          // Branch 1: Get the list of actual users
          users: [
            { $match: { isActive: true } },
            {
              $project: {
                _id: 1,
                fullname: { $concat: ["$firstName", " ", "$lastName"] },
              },
            },
            { $sort: { fullname: 1 } }, // Sort users alphabetically
          ],

          // Branch 2: Create a single static document for "All"
          allOption: [
            // Note: Since this needs to run on *some* document, we use a $unionWith 
            // of a temporary collection or simpler facet logic. Using $facet + $limit:1
            // is a reliable way to generate the static document.
            { $limit: 1 }, 
            {
              $project: {
                _id: { $literal: "All" },
                fullname: { $literal: "All" },
              },
            },
          ],
        },
      },
      
      // Phase 2: Combine the two branches into a single array
      {
        $project: {
          data: { $concatArrays: ["$allOption", "$users"] },
        },
      },
      
      // Phase 3: Deconstruct the array back into individual documents
      {
        $unwind: "$data",
      },
      
      // Phase 4: Replace the root document with the unwound elements
      {
        $replaceRoot: { newRoot: "$data" },
      },
    ]);

    return NextResponse.json(userList, { status: 200 });
  } catch (err) {
    console.error("Error fetching user list:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * @method POST
 * @description Runs the KPI performance report aggregation based on filters.
 * Handles the 'All' employee filter dynamically.
 */
export async function POST(req) {
  try {
    await connectToDB();

    // -------------------------
    // 🔍 PARSE REQUEST BODY & SETUP
    // -------------------------
    const body = await req.json();

    const year = body.year;
    const employee = body.employee || "All"; // "All" or ObjectId string
    const reportType = body.reportType || "Monthly"; // "Weekly" or "Monthly"
    const months = body.months || [];
    const weeks = body.weeks || [];

    // Build month date ranges (used for filtering in MDB pipeline)
    const monthDateRanges = months.map((m) => ({
      start: new Date(year, m - 1, 1),
      end: new Date(year, m, 0, 23, 59, 59),
    }));

    // Employee filter: Handles 'All' by setting the filter to an empty object, 
    // which effectively matches all documents, or by using the specific ObjectId.
    const employeeFilter =
      employee !== "All" ? { _id: new mongoose.Types.ObjectId(employee) } : {};

    // -------------------------
    // 🚀 AGGREGATION
    // -------------------------
    const results = await User.aggregate([
      // 1️⃣ Filter active users + optional employee
      { $match: { isActive: true, ...employeeFilter } }, // The fix is here: employeeFilter handles "All"

      // 2️⃣ Lookup user access control (applyKpi: true)
      {
        $lookup: {
          from: "useraccesscontrol",
          localField: "_id",
          foreignField: "userId",
          as: "accessControl",
        },
      },
      {
        $match: {
          "accessControl.formAccess": {
            $elemMatch: { "partialAccess.permissions.applyKpi": true },
          },
        },
      },

      // 3️⃣ Lookup weekly evaluations
      {
        $lookup: {
          from: "weeklyevaluations",
          localField: "_id",
          foreignField: "userId",
          as: "evaluations",
        },
      },

      // 4️⃣ FIXED: Filter evaluations by selected months/weeks
      {
        $addFields: {
          evaluations: {
            $filter: {
              input: "$evaluations",
              as: "ev",
              cond: {
                $or: monthDateRanges.map((r) => ({
                  $and: [
                    { $gte: ["$$ev.weekStart", r.start] },
                    { $lte: ["$$ev.weekStart", r.end] },
                    
                    ...(reportType === "Weekly"
                      ? [{ $in: ["$$ev.weekNumber", weeks] }]
                      : []),
                  ],
                })),
              },
            },
          },
        },
      },

      // 5️⃣ FIXED: Compute per-month evaluation counts (for dynamic denominator)
      {
        $addFields: {
          monthEvalCounts: {
            $map: {
              input: monthDateRanges,
              as: "m",
              in: {
                monthStart: "$$m.start", 
                monthEnd: "$$m.end",
                count: {
                  $size: {
                    $filter: {
                      input: "$evaluations",
                      as: "ev",
                      cond: {
                        $and: [
                          { $gte: ["$$ev.weekStart", "$$m.start"] },
                          { $lte: ["$$ev.weekStart", "$$m.end"] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 6️⃣ Compute dynamic denominator
      {
        $addFields: {
          denominator: 
            reportType === "Weekly" && weeks.length > 0
              ? weeks.length 
              : {
                  $sum: {
                    $map: {
                      input: "$monthEvalCounts",
                      as: "m",
                      in: { $cond: [{ $gt: ["$$m.count", 0] }, 4, 0] },
                    },
                  },
                },
        },
      },

      // 7️⃣ Compute totalScore & totalWeightedRating
      {
        $addFields: {
          totalScore: { $sum: "$evaluations.totalScore" },
          totalWeightedRating: { $sum: "$evaluations.totalWeightedRating" },
        },
      },

      // 8️⃣ Compute averages using dynamic denominator
      {
        $addFields: {
          avgScore: {
            $cond: [
              { $gt: ["$denominator", 0] },
              { $round: [{ $divide: ["$totalScore", "$denominator"] }, 1] },
              0,
            ],
          },
          avgWeightedRating: {
            $cond: [
              { $gt: ["$denominator", 0] },
              {
                $round: [
                  { $divide: ["$totalWeightedRating", "$denominator"] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },

      // 9️⃣ Compute Performance & Action
      {
        $addFields: {
          Performance: {
            $switch: {
              branches: [
                { case: { $eq: ["$denominator", 0] }, then: "No Data" },
                { case: { $lte: ["$avgWeightedRating", 1] }, then: "Poor" },
                { case: { $lte: ["$avgWeightedRating", 2] }, then: "Partial" },
                { case: { $lte: ["$avgWeightedRating", 3] }, then: "Normal" },
                { case: { $lte: ["$avgWeightedRating", 4] }, then: "Good" },
                { case: { $gt: ["$avgWeightedRating", 4] }, then: "Excellent" },
              ],
              default: "Unknown",
            },
          },
          Action: {
            $switch: {
              branches: [
                { case: { $eq: ["$denominator", 0] }, then: "No Action" },
                {
                  case: { $lte: ["$avgWeightedRating", 1] },
                  then: "Urgent Meeting",
                },
                {
                  case: { $lte: ["$avgWeightedRating", 2] },
                  then: "HR Meeting",
                },
                { case: { $lte: ["$avgWeightedRating", 3] }, then: "Motivate" },
                { case: { $lte: ["$avgWeightedRating", 4] }, then: "Nothing" },
                { case: { $lte: ["$avgWeightedRating", 5] }, then: "Bonus" },
              ],
              default: "Unknown",
            },
          },
        },
      },

      // 10️⃣ Final projection
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: { $concat: ["$firstName", " ", "$lastName"] },
          totalScore: 1,
          totalWeightedRating: 1,
          denominator: 1,
          avgScore: 1,
          avgWeightedRating: 1,
          Performance: 1,
          Action: 1,
        },
      },
    ]);

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    console.error("Error fetching performance:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}