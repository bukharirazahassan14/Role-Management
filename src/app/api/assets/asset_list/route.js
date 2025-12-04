import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    // Connect to MongoDB
    await connectToDB();
    const db = mongoose.connection.db;

    const assetsCollection = db.collection("assets");

    // Fetch all documents including _id
    const results = await assetsCollection.find({}).toArray();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error fetching assets:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
