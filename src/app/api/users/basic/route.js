
//src/app/api/users/basic/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User.js";

// ✅ GET - Fetch only fullName + primaryEmail
export async function GET(req) {
  try {
    await connectToDB();

    // Select only required fields
    const users = await User.find({}, "firstName lastName primaryEmail").lean();

    const formatted = users.map((u) => ({
      id: u._id.toString(),
      fullName: `${u.firstName} ${u.lastName}`, // 👈 build fullName
      email: u.primaryEmail,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching basic users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
