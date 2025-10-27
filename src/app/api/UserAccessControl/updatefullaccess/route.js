import connectToDB from "@/lib/mongodb.js";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    // ✅ Connect via Mongoose
    const mongooseConn = await connectToDB();

    // ⚠️ Use native MongoDB collection via mongoose.connection.db
    const db = mongooseConn.connection.db || mongooseConn.db; 

    const body = await req.json();
    const { formId, userIds, selectedAccessLevel } = body;

    if (!formId || !userIds?.length || !selectedAccessLevel) {
      return new Response(JSON.stringify({ error: "❌ Missing required fields" }), { status: 400 });
    }

    const resetPermissions = {
      enabled: false,
      permissions: { view: false, edit: false, add: false, delete: false, applyKpi: false },
    };

    let updateFields = {};
    if (selectedAccessLevel === "Full Access") {
      updateFields = {
        "formAccess.$.fullAccess": true,
        "formAccess.$.noAccess": false,
        "formAccess.$.partialAccess": resetPermissions,
      };
    } else if (selectedAccessLevel === "No Access") {
      updateFields = {
        "formAccess.$.fullAccess": false,
        "formAccess.$.noAccess": true,
        "formAccess.$.partialAccess": resetPermissions,
      };
    } else {
      return new Response(JSON.stringify({ error: "❌ Partial Access should be handled separately" }), { status: 400 });
    }

    const bulkOps = userIds.map((userId) => ({
      updateOne: {
        filter: { userId: new ObjectId(userId), "formAccess.formId": new ObjectId(formId) },
        update: { $set: { ...updateFields, updatedAt: new Date() } },
      },
    }));

    // ⚡ Use native bulkWrite via db
    const result = await db.collection("useraccesscontrol").bulkWrite(bulkOps, { ordered: false });

    return new Response(JSON.stringify({
      message: "✅ Access levels updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    }), { status: 200 });

  } catch (error) {
    console.error("❌ Update failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
