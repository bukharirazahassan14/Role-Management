import connectToDB from "@/lib/mongodb";
import User from "@/models/User.js";

// ✅ GET - Fetch single user by id
export async function GET(req, context) {
  try {
    // ✅ Await params in App Router
    const { id } = await context.params;

    await connectToDB();

    const u = await User.findById(id).populate("role").lean();

    if (!u) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

       const formatted = {
      id: u._id.toString(),
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.primaryEmail,
      secondaryEmail: u.secondaryEmail,
      role: u.role
        ? {
            _id: u.role._id.toString(),
            name: u.role.name,
            description: u.role.description || null, // ✅ include description
          }
        : null,
      jd: u.jd,
      password: u.password,  
      createdAt: u.created_at,
      joiningDate: u.joiningDate,
      isActive: u.isActive,
    };

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
