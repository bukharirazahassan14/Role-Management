import connectToDB from "@/lib/mongodb.js";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    // ✅ Connect to MongoDB
    const mongooseConn = await connectToDB();
    const db = mongooseConn.connection.db || mongooseConn.db;

    const body = await req.json();
    const { formId, userIds, userAccessValue } = body;

    if (!formId || !userIds) {
      return new Response(
        JSON.stringify({ error: "❌ Missing required fields" }),
        { status: 400 }
      );
    }

    // 🧠 Default permissions
    let permissions = { view: false, edit: false, add: false, delete: false, applyKpi: false };
    let enabled = true; // ✅ Always true for partial access updates

    // ✅ Case 1: Boolean (true / false)
    if (typeof userAccessValue === "boolean") {
      permissions = {
        view: userAccessValue,
        edit: userAccessValue,
        add: userAccessValue,
        delete: userAccessValue,
        applyKpi: userAccessValue,
      };
    }

    // ✅ Case 2: Object ({ view, edit, add, delete })
    else if (typeof userAccessValue === "object" && userAccessValue !== null) {
      permissions = {
        view: !!userAccessValue.view,
        edit: !!userAccessValue.edit,
        add: !!userAccessValue.add,
        delete: !!userAccessValue.delete,
        applyKpi: !!userAccessValue.applyKpi,
      };
      // Force enabled = true (you requested it should always be true)
      enabled = true;
    }

    // 🔧 Prepare update document — no selectedAccessLevel here
    const updateDoc = {
      $set: {
        "formAccess.$.fullAccess": false,
        "formAccess.$.noAccess": false,
        "formAccess.$.partialAccess.enabled": enabled,
        "formAccess.$.partialAccess.permissions": permissions,
        updatedAt: new Date(),
      },
      // 🚫 Remove selectedAccessLevel if it already exists
      $unset: {
        "formAccess.$.selectedAccessLevel": "",
      },
    };

    // ⚡ Perform the update
    const result = await db.collection("useraccesscontrol").updateOne(
      {
        userId: new ObjectId(userIds),
        "formAccess.formId": new ObjectId(formId),
      },
      updateDoc
    );

    if (result.modifiedCount > 0) {
      return new Response(
        JSON.stringify({
          message: "✅ Partial access updated successfully",
          enabled,
          permissions,
        }),
        { status: 200 }
      );
    }

    console.warn("⚠️ No matching document found or no changes made");
    return new Response(
      JSON.stringify({ message: "⚠️ No matching document found" }),
      { status: 404 }
    );
  } catch (error) {
    console.error("❌ Update failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
