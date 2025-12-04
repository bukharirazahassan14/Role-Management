// src/app/api/assets/update/[id]/route.js

import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export async function PUT(req, context) {
  try {
    await connectToDB();

    // Get the ID from the URL
    const { id } = await context.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: "Invalid ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();

    // Ensure body is an object
    if (typeof body !== "object" || Array.isArray(body) || body === null) {
      return new Response(
        JSON.stringify({ error: "Request body must be an object" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = mongoose.connection.db;
    const assetsCollection = db.collection("assets");

    // 🔥 Remove _id from body so MongoDB doesn't throw error
    const { _id, ...updateData } = body;

    // Update the document
    await assetsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Fetch the full updated document
    const updatedAsset = await assetsCollection.findOne({ _id: new ObjectId(id) });

    if (!updatedAsset) {
      return new Response(
        JSON.stringify({ error: "Asset not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Asset updated successfully",
        asset: updatedAsset, // ✅ full updated document
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Update Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/* ===========================
   DELETE ASSET - DELETE
=========================== */
export async function DELETE(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: "Invalid ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = mongoose.connection.db;
    const assetsCollection = db.collection("assets");

    const deletedAsset = await assetsCollection.findOneAndDelete({ _id: new ObjectId(id) });

    if (!deletedAsset.value) {
      return new Response(
        JSON.stringify({ error: "Asset not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Asset deleted successfully",
        asset: deletedAsset.value,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}