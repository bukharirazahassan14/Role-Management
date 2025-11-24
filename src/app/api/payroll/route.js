// app/api/payroll/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userID = searchParams.get("userID");

    if (!userID) {
      return new Response(JSON.stringify({ error: "userID is required" }), {
        status: 400,
      });
    }

    const userIdObj = new mongoose.Types.ObjectId(userID);

    // 🔥 Run your full payroll aggregation
    const results = await mongoose.connection
      .collection("payrollsetup")
      .aggregate([
        // 1. Load payroll
        {
          $facet: {
            userData: [
              { $match: { userId: userIdObj } }
            ]
          }
        },

        // 2. Default seed
        {
          $addFields: {
            seed: [{
              userId: userIdObj,
              basicSalary: 0,
              grossSalary: 0,
              netAmount: 0,
              employmentType: "",
              payrollFrequency: "",
              allowances: [],
              deductions: []
            }]
          }
        },

        // 3. Pick existing or default
        {
          $project: {
            payrollData: {
              $cond: [
                { $gt: [{ $size: "$userData" }, 0] },
                { $arrayElemAt: ["$userData", 0] },
                { $arrayElemAt: ["$seed", 0] }
              ]
            }
          }
        },

        // 4. Root swap
        { $replaceRoot: { newRoot: "$payrollData" } },

        // 5. Get all master allowances
        {
          $lookup: {
            from: "allowances",
            pipeline: [],
            as: "masterAllowances"
          }
        },

        // 6. Merge allowances
        {
          $addFields: {
            allowances: {
              $map: {
                input: "$masterAllowances",
                as: "m",
                in: {
                  _id: "$$m._id",
                  name: "$$m.name",
                  amount: {
                    $let: {
                      vars: {
                        found: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$allowances",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$m._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: { $ifNull: ["$$found.amount", 0] }
                    }
                  }
                }
              }
            }
          }
        },

        // 7. Get all master deductions
        {
          $lookup: {
            from: "deductions",
            pipeline: [],
            as: "masterDeductions"
          }
        },

        // 8. Merge deductions
        {
          $addFields: {
            deductions: {
              $map: {
                input: "$masterDeductions",
                as: "m",
                in: {
                  _id: "$$m._id",
                  name: "$$m.name",
                  amount: {
                    $let: {
                      vars: {
                        found: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$deductions",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$m._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: { $ifNull: ["$$found.amount", 0] }
                    }
                  }
                }
              }
            }
          }
        },

        // Cleanup
        { $unset: ["masterAllowances", "masterDeductions", "seed", "userData"] }
      ])
      .toArray();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "No payroll data" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(results[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Error fetching payroll:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
    }

    let docId;
    try {
      docId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid ObjectId" }), { status: 400 });
    }

    const deleteResult = await mongoose.connection
      .collection("payrollsetup")
      .deleteOne({ userId: docId });

    if (deleteResult.deletedCount === 0) {
      return new Response(JSON.stringify({ message: "No payroll record found to delete" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Payroll setup deleted successfully" }), { status: 200 });
  } catch (err) {
    console.error("❌ Error deleting payroll:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
