//api/UserAccessControl/UserByRoleAPI/route.js

import connectToDB from "@/lib/mongodb";
// Assuming these paths are correct for your environment
import User from "@/models/User.js";
import Role from "@/models/Role.js"; 

/**
 * ✅ GET - Fetch all users or filter them by a specific roleName.
 * * This handler supports the following queries:
 * 1. GET /api/users                  -> Returns all users.
 * 2. GET /api/users?roleName=...     -> Returns users with the specified role.
 */
export async function GET(req) {
  try {
    await connectToDB();

    // 1. Extract roleName from the request URL
    const { searchParams } = new URL(req.url);
    const roleName = searchParams.get("roleName");

    let userFilter = {};

    // 2. If roleName is provided, find the corresponding Role ID for filtering
    if (roleName) {
      // Find the Role document that matches the provided role name.
      const role = await Role.findOne({ name: roleName });

      if (role) {
        // Set the user filter to match the found role's ObjectId
        userFilter.role = role._id;
      } else {
        // If the role doesn't exist, return an empty array
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. Fetch users based on the filter, populating the 'role' field
    const users = await User.find(userFilter).populate("role").lean();

    // 4. Format the output to ensure clean JSON structure
    const formatted = users.map((u) => ({
      id: u._id.toString(),
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.primaryEmail,
      // The 'role' field is now the populated Role document (or null if not set)
      role: u.role 
        ? {
            _id: u.role._id.toString(),
            name: u.role.name,
            description: u.role.description || null, 
          }
        : null,
      createdAt: u.created_at,
      isActive: u.isActive,
      // You can include other relevant fields here if needed in the frontend
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



// import connectToDB from "@/lib/mongodb.js";
// import mongoose from "mongoose";

// export async function GET(req) {
//   try {
//     await connectToDB();

//     const { searchParams } = new URL(req.url);
//     const roleID = searchParams.get("roleID");

//     if (!roleID) {
//       return new Response(
//         JSON.stringify({ error: "Missing required parameter: roleID" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     const db = mongoose.connection.db;

//     // ✅ Use EXACT same query as provided (no change)
//     const results = await db.collection("UserAccessControl").aggregate(
//       [
//         // 1️⃣ Match by roleId (uses index)
//         {
//           $match: { roleId: new mongoose.Types.ObjectId(roleID) }
//         },

//         // 2️⃣ Lookup Role name
//         {
//           $lookup: {
//             from: "roles",
//             let: { rid: "$roleId" },
//             pipeline: [
//               { $match: { $expr: { $eq: ["$_id", "$$rid"] } } },
//               { $project: { _id: 1, name: 1 } }
//             ],
//             as: "roleInfo"
//           }
//         },
//         { $unwind: "$roleInfo" },

//         // 3️⃣ Lookup User info
//         {
//           $lookup: {
//             from: "users",
//             let: { uid: "$userId" },
//             pipeline: [
//               { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
//               { $project: { _id: 1, firstName: 1, lastName: 1 } }
//             ],
//             as: "userInfo"
//           }
//         },
//         { $unwind: "$userInfo" },

//         // 4️⃣ Unwind formAccess
//         { $unwind: "$formAccess" },

//         // 5️⃣ Lookup Form name
//         {
//           $lookup: {
//             from: "accesscontrolform",
//             let: { fid: "$formAccess.formId" },
//             pipeline: [
//               { $match: { $expr: { $eq: ["$_id", "$$fid"] } } },
//               { $project: { _id: 1, name: 1 } }
//             ],
//             as: "formInfo"
//           }
//         },
//         { $unwind: "$formInfo" },

//         // 6️⃣ Project only needed fields
//         {
//           $project: {
//             _id: 0,
//             userId: "$userInfo._id",
//             userName: {
//               $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"]
//             },
//             formId: "$formInfo._id",
//             formName: "$formInfo.name",
//             fullAccess: "$formAccess.fullAccess",
//             noAccess: "$formAccess.noAccess",
//             partialAccess: "$formAccess.partialAccess"
//           }
//         },

//         // 7️⃣ Group by user (no role fields)
//         {
//           $group: {
//             _id: {
//               userId: "$userId",
//               userName: "$userName"
//             },
//             forms: {
//               $push: {
//                 formId: "$formId",
//                 formName: "$formName",
//                 fullAccess: "$fullAccess",
//                 noAccess: "$noAccess",
//                 partialAccess: "$partialAccess"
//               }
//             }
//           }
//         },

//         // 8️⃣ Final output — clean and compact
//         {
//           $project: {
//             _id: 0,
//             userId: "$_id.userId",
//             userName: "$_id.userName",
//             forms: 1
//           }
//         }
//       ],
//       { allowDiskUse: true }
//     ).toArray();

//     return new Response(JSON.stringify(results), {
//       status: 200,
//       headers: { "Content-Type": "application/json" }
//     });

//   } catch (error) {
//     console.error("❌ Error fetching user access control:", error);
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }
