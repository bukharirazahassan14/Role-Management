import dbConnect from "@/lib/mongodb";
import PasswordReset from "@/models/PasswordReset";

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();

    // Find all reset requests that are still valid, not used, not notified
    const resets = await PasswordReset.find({
       notified: false,
    }).populate("userId", "primaryEmail firstName lastName");

    // Mark them as notified so they don't appear again
    if (resets.length > 0) {
      await PasswordReset.updateMany(
        { _id: { $in: resets.map((r) => r._id) } },
        { $set: { notified: false } }
      );
    }

    return new Response(JSON.stringify(resets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Notification fetch error:", err);
    return new Response(
      JSON.stringify({ message: "⚠️ Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
