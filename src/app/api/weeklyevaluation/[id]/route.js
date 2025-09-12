// src/app/api/weeklyevaluation/[id]/route.js
import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";

export async function GET(req, context) {
  try {
    await connectToDB();

    // ✅ await context.params
    const { id } = await context.params;

    const evaluation = await WeeklyEvaluation.findById(id).populate(
      "userId",
      "fullName email"
    );

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    await connectToDB();

    // ✅ await context.params
    const { id } = await context.params;
    const body = await req.json();

    const updatedEvaluation = await WeeklyEvaluation.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    ).populate("userId", "fullName email");

    if (!updatedEvaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Evaluation updated successfully",
        evaluation: updatedEvaluation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating evaluation:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE handler (like GET & PUT)
export async function DELETE(req, context) {
  try {
    await connectToDB();
    const { id } = await context.params;

    const deletedEvaluation = await WeeklyEvaluation.findByIdAndDelete(id);

    if (!deletedEvaluation) {
      return NextResponse.json({ message: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Evaluation deleted successfully", evaluation: deletedEvaluation },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting evaluation:", error);
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
  }
}