import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Count only users with isActive = true
    const activeCount = await User.countDocuments({ isActive: true });

    return new Response(
      JSON.stringify({ activeUsers: activeCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error fetching active users:", err);
    return new Response(
      JSON.stringify({ message: "⚠️ Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
