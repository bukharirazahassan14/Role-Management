///app/api/roles/userCounts/route.js

import connectToDB from "@/lib/mongodb.js";
import Role from "@/models/Role.js";
import User from "@/models/User.js";

export async function GET(req) {
  try {
    await connectToDB();

    // 1. Aggregate active users counts per role
    const userCounts = await User.aggregate([
      {
        $match: { isActive: true } // only active users
      },
      {
        $group: {
          _id: "$role",            // group by role ObjectId
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Convert to map for easy lookup
    const countsMap = userCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // 3. Get all roles
    const roles = await Role.find().lean();

    // 4. Combine roles with counts
    const formatted = roles.map(r => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
      count: countsMap[r._id.toString()] || 0 // show 0 if no active user
    }));

    // 5. Compute total active users
    const totalCount = formatted.reduce((sum, role) => sum + role.count, 0);

    // 6. Return response with both roles & total
    return new Response(JSON.stringify({
      roles: formatted,
      totalCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching roles with counts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
