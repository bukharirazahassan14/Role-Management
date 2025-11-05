import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb.js";
import UserAccessControl from "@/models/useraccesscontrol.js";

export async function GET(req) {
  try {
    await connectToDB();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const roleId = url.searchParams.get("roleId");

    if (!userId || !roleId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or roleId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Convert IDs in Node.js, not Mongo
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const roleObjectId = new mongoose.Types.ObjectId(roleId);

    const result = await UserAccessControl.aggregate([
      {
        $match: {
          userId: userObjectId,
          roleId: roleObjectId,
        },
      },
      {
        $addFields: {
          hasValidFormAccess: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$formAccess",
                    as: "fa",
                    cond: {
                      $and: [
                        { $eq: ["$$fa.noAccess", false] },
                        {
                          $or: [
                            { $eq: ["$$fa.fullAccess", true] },
                            {
                              $and: [
                                { $eq: ["$$fa.partialAccess.enabled", true] },
                                {
                                  $or: [
                                    { $eq: ["$$fa.partialAccess.permissions.view", true] },
                                    { $eq: ["$$fa.partialAccess.permissions.edit", true] },
                                    { $eq: ["$$fa.partialAccess.permissions.add", true] },
                                    { $eq: ["$$fa.partialAccess.permissions.delete", true] },
                                    { $eq: ["$$fa.partialAccess.permissions.applyKpi", true] },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          login: "$hasValidFormAccess",
        },
      },
      {
        $project: {
          hasValidFormAccess: 0,
        },
      },
    ]);

    if (!result || result.length === 0) {
      return new Response(
        JSON.stringify({ message: "No user access control found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error checking user access control:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
