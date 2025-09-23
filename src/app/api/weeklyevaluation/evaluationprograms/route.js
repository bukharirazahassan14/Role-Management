//src/app/api/weeklyevaluation/evaluationprograms/route.js
import connectToDB from "@/lib/mongodb";
import EvaluationProgram from "@/models/EvaluationProgram";

export async function GET() {
  try {
    await connectToDB();
    const programs = await EvaluationProgram.find().sort({ createdAt: 1 }).lean();
    return new Response(JSON.stringify(programs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching evaluation programs:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST - Add new program
export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const { Name, Description, Weightage } = body;

    if (!Name || !Description || !Weightage) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    // 🔑 Check total Weightage
    const total = await EvaluationProgram.aggregate([
      { $group: { _id: null, total: { $sum: "$Weightage" } } }
    ]);

    const currentTotal = total[0]?.total || 0;
    if (currentTotal + Number(Weightage) > 100) {
      return new Response(
        JSON.stringify({ error: "Total Weightage cannot exceed 100%" }),
        { status: 400 }
      );
    }

    const newProgram = new EvaluationProgram({
      Name,
      Description,
      Weightage,
    });

    await newProgram.save();

    return new Response(JSON.stringify(newProgram), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error adding evaluation program:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ PATCH - Update a program
export async function PATCH(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const { id, Name, Description, Weightage } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Program ID is required" }),
        { status: 400 }
      );
    }

    // 🔑 Check new total Weightage
    const total = await EvaluationProgram.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$Weightage" },
        },
      },
    ]);

    const currentTotal = total[0]?.total || 0;

    // find the existing program
    const existing = await EvaluationProgram.findById(id).lean();
    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        { status: 404 }
      );
    }

    // subtract old weight and add new
    const adjustedTotal =
      currentTotal - (existing.Weightage || 0) + Number(Weightage);

    if (adjustedTotal > 100) {
      return new Response(
        JSON.stringify({ error: "Total Weightage cannot exceed 100%" }),
        { status: 400 }
      );
    }

    const updatedProgram = await EvaluationProgram.findByIdAndUpdate(
      id,
      { Name, Description, Weightage },
      { new: true }
    ).lean();

    return new Response(JSON.stringify(updatedProgram), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating evaluation program:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

