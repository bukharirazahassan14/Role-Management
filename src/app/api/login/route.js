import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role"; 
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectToDB();

    const { email, password } = await req.json();

    // 🔍 find user by primaryEmail and populate role
    const user = await User.findOne({ primaryEmail: email }).populate("role");

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      });
    }

    // 🔑 check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      });
    }

    // ✅ success
    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          primaryEmail: user.primaryEmail,
          role: user.role?.name || "No Role",
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
