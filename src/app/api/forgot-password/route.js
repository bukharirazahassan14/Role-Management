import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import dbConnect from "@/lib/mongodb";

export async function POST(req) {
  try {
    await dbConnect();

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ message: "❌ Email is required" }),
        { status: 400 }
      );
    }

    // 🔹 Check if user exists
    const user = await User.findOne({ primaryEmail: email });
    if (!user) {
      return new Response(
        JSON.stringify({ message: "❌ User not found" }),
        { status: 404 }
      );
    }

    // 🔹 Save forgot password request (only userId + notified)
    await PasswordReset.create({
      userId: user._id,
      notified: false,
    });

    return new Response(
      JSON.stringify({ message: "✅ Forgot password request recorded" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Forgot password error:", err);
    return new Response(
      JSON.stringify({ message: "⚠️ Something went wrong" }),
      { status: 500 }
    );
  }
}
