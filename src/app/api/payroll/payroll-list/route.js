// api/payroll/payroll-list/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const results = await mongoose.connection
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "payrollsetup",
            localField: "_id",
            foreignField: "userId",
            as: "payroll",
          },
        },
        {
          $unwind: {
            path: "$payroll",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,

            // Full name
            fullName: {
              $concat: [
                { $ifNull: ["$firstName", ""] },
                " ",
                { $ifNull: ["$lastName", ""] },
              ],
            },

            // ✅ Use JD from users
            role: { $ifNull: ["$jd", "-"] },

            type: { $ifNull: ["$payroll.employmentType", "-"] },

            payrollCycle: { $ifNull: ["$payroll.payrollFrequency", "-"] },

            basicSalary: { $ifNull: ["$payroll.basicSalary", 0] },

            allowances: {
              $ifNull: [
                {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$payroll.allowances", []] },
                      as: "item",
                      in: { $ifNull: ["$$item.amount", 0] },
                    },
                  },
                },
                0,
              ],
            },

            deductions: {
              $ifNull: [
                {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$payroll.deductions", []] },
                      as: "item",
                      in: { $ifNull: ["$$item.amount", 0] },
                    },
                  },
                },
                0,
              ],
            },
            grossSalary: { $ifNull: ["$payroll.grossSalary", 0] },

            netAmount: { $ifNull: ["$payroll.netAmount", 0] },
          },
        },
      ])
      .toArray();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
