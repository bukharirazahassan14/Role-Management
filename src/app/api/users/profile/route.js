import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userID = searchParams.get("userID");

    if (!userID) {
      return new Response(
        JSON.stringify({ error: "userID is required" }),
        { status: 400 }
      );
    }

    // ✅ Aggregate user profile with role info
    const results = await mongoose.connection.collection("users").aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userID),
        },
      },
      {
        $lookup: {
          from: "roles",               // roles collection
          localField: "role",          // field in users collection
          foreignField: "_id",         // match with _id in roles
          as: "roleDetails",           // output field
        },
      },
      {
        $unwind: "$roleDetails",       // flatten array
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          primaryEmail: 1,
          fatherName: 1,
          phone: 1,
          emergencyContact: 1,
          emergencyRelation: 1,
          cnic: 1,
          jd: 1,
          exp: 1,
          isActive: 1,
          created_at: 1,
          joiningDate: 1,
          role: {
            _id: "$roleDetails._id",
            name: "$roleDetails.name",
            description: "$roleDetails.description",
          },
        },
      },
    ]).toArray();

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(results[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
