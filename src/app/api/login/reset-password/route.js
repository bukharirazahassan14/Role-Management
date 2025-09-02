// /app/api/login/reset-password/route.js
import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectToDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ primaryEmail: email });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPassword = false;
    await user.save();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("reset-password error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
