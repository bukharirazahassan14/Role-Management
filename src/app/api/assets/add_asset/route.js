import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const db = mongoose.connection.db;

    const data = await req.json();

    if (!data.name || !data.type) {
      return new Response(
        JSON.stringify({ error: "Name and type are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const assetsCollection = db.collection("assets");

    // Insert the new asset
    const result = await assetsCollection.insertOne({
      name: data.name,
      type: data.type,
      assignedTo: data.assignedTo || "",
      serial: data.serial || "",
      purchase: data.purchase || "",
      value: data.value || "",
      note: data.note || "",
      status: data.status || "Available",
    });

    // Fetch the newly inserted document
    const newAsset = await assetsCollection.findOne({ _id: result.insertedId });

    return new Response(
      JSON.stringify({ message: "Asset added", asset: newAsset }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Error adding asset:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
