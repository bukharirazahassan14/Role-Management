// //api/UserAccessControl/UserByRoleAPI/route.js

import connectToDB from "@/lib/mongodb.js";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const roleID = searchParams.get("roleID");

    if (!roleID) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: roleID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = mongoose.connection.db;

    // ✅ Use EXACT same query as provided (no change)
    const results = await db.collection("useraccesscontrol").aggregate(
      [
        // 1️⃣ Match by roleId (uses index)
        {
          $match: { roleId: new mongoose.Types.ObjectId(roleID) }
        },

        // 2️⃣ Lookup Role name
        {
          $lookup: {
            from: "roles",
            let: { rid: "$roleId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$rid"] } } },
              { $project: { _id: 1, name: 1 } }
            ],
            as: "roleInfo"
          }
        },
        { $unwind: "$roleInfo" },

        // 3️⃣ Lookup User info
        {
          $lookup: {
            from: "users",
            let: { uid: "$userId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
              { $project: { _id: 1, firstName: 1, lastName: 1 } }
            ],
            as: "userInfo"
          }
        },
        { $unwind: "$userInfo" },

        // 4️⃣ Unwind formAccess
        { $unwind: "$formAccess" },

        // 5️⃣ Lookup Form name
        {
          $lookup: {
            from: "accesscontrolform",
            let: { fid: "$formAccess.formId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$fid"] } } },
              { $project: { _id: 1, name: 1 } }
            ],
            as: "formInfo"
          }
        },
        { $unwind: "$formInfo" },

        // 6️⃣ Project only needed fields
        {
          $project: {
            _id: 0,
            userId: "$userInfo._id",
            userName: {
              $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"]
            },
            formId: "$formInfo._id",
            formName: "$formInfo.name",
            fullAccess: "$formAccess.fullAccess",
            noAccess: "$formAccess.noAccess",
            partialAccess: "$formAccess.partialAccess"
          }
        },

        // 7️⃣ Group by user (no role fields)
        {
          $group: {
            _id: {
              userId: "$userId",
              userName: "$userName"
            },
            forms: {
              $push: {
                formId: "$formId",
                formName: "$formName",
                fullAccess: "$fullAccess",
                noAccess: "$noAccess",
                partialAccess: "$partialAccess"
              }
            }
          }
        },

        // 8️⃣ Final output — clean and compact
        {
          $project: {
            _id: 0,
            userId: "$_id.userId",
            userName: "$_id.userName",
            forms: 1
          }
        }
      ],
      { allowDiskUse: true }
    ).toArray();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error fetching user access control:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
