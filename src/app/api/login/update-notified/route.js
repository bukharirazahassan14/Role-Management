import dbConnect from "@/lib/mongodb";
import PasswordReset from "@/models/PasswordReset";

export async function POST(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ message: "❌ userId is required" }),
        { status: 400 }
      );
    }

    // Update the latest reset request for that user
    const resetDoc = await PasswordReset.findOneAndUpdate(
      { userId, notified: false },
      { $set: { notified: true } },
      { new: true, sort: { createdAt: -1 } } // ✅ Get the most recent one
    );

    if (!resetDoc) {
      return new Response(
        JSON.stringify({ message: "⚠️ No reset record found to update" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "✅ Notified updated successfully",
        resetDoc,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Update notified error:", err);
    return new Response(
      JSON.stringify({ message: "⚠️ Something went wrong" }),
      { status: 500 }
    );
  }
}
