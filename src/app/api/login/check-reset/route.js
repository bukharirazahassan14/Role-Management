import connectToDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    const user = await User.findOne({ primaryEmail: email });

    if (!user) {
      return new Response(JSON.stringify({ resetPassword: false }), { status: 200 });
    }

    return new Response(JSON.stringify({ resetPassword: user.resetPassword || false }), {
      status: 200,
    });
  } catch (error) {
    console.error("Check reset error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
