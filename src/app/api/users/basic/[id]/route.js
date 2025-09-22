import connectToDB from "@/lib/mongodb";
import User from "@/models/User.js";

// ✅ GET - Fetch single user by ID (fullName + primaryEmail)
export async function GET(req, { params }) {
  try {
    await connectToDB();

    const id = params.id; // 👈 directly access the param

    const user = await User.findById(id, "firstName lastName primaryEmail").lean();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formatted = {
      id: user._id.toString(),
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.primaryEmail,
    };

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
