// api/payroll/setup/route.js
import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // Connect to MongoDB via Mongoose
    await connectToDB();

    const body = await req.json();

    const {
      userId,
      employmentType,
      payrollFrequency,
      basicSalary,
      allowances = [],
      deductions = [],
    } = body;

    // ---------------------------
    // VALIDATION
    // ---------------------------
    if (!userId)
      return Response.json({ error: "userId is required" }, { status: 400 });

    if (!employmentType)
      return Response.json({ error: "employmentType is required" }, { status: 400 });

    if (!payrollFrequency)
      return Response.json({ error: "payrollFrequency is required" }, { status: 400 });

    if (basicSalary === undefined || basicSalary === null)
      return Response.json({ error: "basicSalary is required" }, { status: 400 });

    const userObjectId = new ObjectId(userId);

    // ---------------------------
    // MAP ALLOWANCES AND DEDUCTIONS WITH _ID
    // ---------------------------
    const mappedAllowances = allowances.map(a => ({
      _id: a._id ? new ObjectId(a._id) : new ObjectId(),
      name: a.name,
      amount: Number(a.amount),
    }));

    const mappedDeductions = deductions.map(d => ({
      _id: d._id ? new ObjectId(d._id) : new ObjectId(),
      name: d.name,
      amount: Number(d.amount),
    }));

    // ---------------------------
    // CONNECT TO COLLECTION
    // ---------------------------
    const db = mongoose.connection;
    const payrollCollection = db.collection("payrollsetup");

    // ---------------------------
    // FETCH EXISTING RECORD
    // ---------------------------
    const existingRecord = await payrollCollection.findOne({
      userId: userObjectId,
    });

    // ---------------------------
    // SALARY CALCULATIONS
    // ---------------------------
    const basicSalaryNum = Number(basicSalary) || 0;

    const totalAllowances = mappedAllowances.reduce(
      (sum, a) => sum + Number(a.amount || 0),
      0
    );

    const totalDeductions = mappedDeductions.reduce(
      (sum, d) => sum + Number(d.amount || 0),
      0
    );

    const grossSalary = basicSalaryNum + totalAllowances;
    const netAmount = grossSalary - totalDeductions;

    // ---------------------------
    // UPDATE OR INSERT
    // ---------------------------
    if (existingRecord) {
      const updated = await payrollCollection.updateOne(
        { userId: userObjectId },
        {
          $set: {
            employmentType,
            payrollFrequency,
            basicSalary: basicSalaryNum,
            allowances: mappedAllowances,
            deductions: mappedDeductions,
            grossSalary,
            netAmount,
            updatedAt: new Date(),
          },
        }
      );

      return Response.json(
        {
          message: "Payroll setup updated successfully",
          modifiedCount: updated.modifiedCount,
        },
        { status: 200 }
      );
    }

    const inserted = await payrollCollection.insertOne({
      userId: userObjectId,
      employmentType,
      payrollFrequency,
      basicSalary: basicSalaryNum,
      allowances: mappedAllowances,
      deductions: mappedDeductions,
      grossSalary,
      netAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json(
      {
        message: "Payroll setup created successfully",
        insertedId: inserted.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payroll Setup API Error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
