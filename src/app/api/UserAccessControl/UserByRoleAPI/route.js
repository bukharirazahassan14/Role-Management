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
