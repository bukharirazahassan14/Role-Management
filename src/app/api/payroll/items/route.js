// api/payroll/items/route.js
import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    const { type, name, amount } = body;

    if (!type || !name || amount === undefined) {
      return Response.json(
        { error: "Missing required fields: type, name, amount" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    let collectionName;
    if (type === "ALLOWANCE") collectionName = "allowances";
    else if (type === "DEDUCTION") collectionName = "deductions";
    else {
      return Response.json(
        { error: "Invalid type: must be ALLOWANCE or DEDUCTION" },
        { status: 400 }
      );
    }

    const db = mongoose.connection;

    // ---- DUPLICATE CHECK (CASE-INSENSITIVE) ----
    const existing = await db
      .collection(collectionName)
      .findOne({
        name: { $regex: `^${trimmedName}$`, $options: "i" }, // exact match, case-insensitive
      });

    if (existing) {
      return Response.json(
        { error: `${type} with this name already exists.` },
        { status: 409 }
      );
    }

    // ---- INSERT NEW ITEM ----
    const result = await db.collection(collectionName).insertOne({
      name: trimmedName,
      amount: Number(amount),
      createdAt: new Date(),
    });

    return Response.json(
      {
        message: `${type} created successfully`,
        item: {
          _id: result.insertedId,
          name: trimmedName,
          amount: Number(amount),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
