// src/app/api/weeklyevaluation/[id]/route.js
import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import WeeklyEvaluation from "@/models/WeeklyEvaluation";
import mongoose from "mongoose";

export async function GET(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params; // ✅ userId from params
    const { searchParams } = new URL(req.url);

    const year = parseInt(searchParams.get("year"), 10);
    const month = parseInt(searchParams.get("month"), 10);
    const weekNumber = parseInt(searchParams.get("weekNumber") || "1", 10); // ✅ default 1

    if (!year || !month) {
      return NextResponse.json(
        { error: "Missing year or month" },
        { status: 400 }
      );
    }

    // month range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // find evaluation
    const evaluation = await WeeklyEvaluation.findOne({
      userId: id,
      weekNumber,
      weekStart: { $gte: startDate, $lte: endDate },
    }).populate("userId", "fullName email");

    if (!evaluation) {
      return NextResponse.json(
        {
          error: `Evaluation not found for userId=${id}, year=${year}, month=${month}, week=${weekNumber}`,
        },
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

    const { id } = await context.params;
    const body = await req.json();

    // ✅ Transform evaluationScores like in POST
    const updateData = {
      userId: body.userId,
      evaluatedBy: body.evaluatedBy,
      weekNumber: body.weekNumber,
      weekStart: new Date(body.weekStart),
      weekEnd: new Date(body.weekEnd),
      scores: body.evaluationScores?.map((s) => ({
        kpiId: s._id || s.kpiId, // handle both new + existing
        score: s.score,
        weightage: s.weightage,
        weightedRating: s.weightedRating,
      })),
      comments: body.comments,
      totalScore: body.totalScore,
      totalWeightedRating: body.totalWeightedRating,
    };

    const updatedEvaluation = await WeeklyEvaluation.findByIdAndUpdate(
      id,
      updateData,
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

