import connectToDB from "@/lib/mongodb.js";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    // ✅ Connect to MongoDB
    const mongooseConn = await connectToDB();
    const db = mongooseConn.connection.db || mongooseConn.db;

    // ✅ Parse request body
    const body = await req.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return new Response(
        JSON.stringify({ error: "❌ userId and roleId are required." }),
        { status: 400 }
      );
    }

    // ✅ Find existing UserAccessControl for the user
    const existing = await db
      .collection("useraccesscontrol")
      .findOne({ userId: new ObjectId(userId) });

    if (!existing) {
      return new Response(
        JSON.stringify({
          message:
            "⚠️ No UserAccessControl found for this user. Skipping update.",
        }),
        { status: 404 }
      );
    }

    // ✅ Compare old roleId with new one
    const existingRoleId = existing.roleId.toString();
    const newRoleId = roleId.toString();

    if (existingRoleId === newRoleId) {
      return new Response(
        JSON.stringify({
          message: "ℹ️ Role is the same — no update needed.",
          userId,
          roleId,
        }),
        { status: 200 }
      );
    }

    // ✅ Role changed — fetch all forms
    const forms =
      (await db
        .collection("accesscontrolform")
        .find({}, { projection: { _id: 1, name: 1 } })
        .toArray()) || [];

    if (forms.length === 0) {
      return new Response(
        JSON.stringify({
          error: "⚠️ No forms found in accesscontrolform collection!",
        }),
        { status: 404 }
      );
    }

    // ✅ Build new formAccess array (same as default structure)
    const formAccessArray = forms.map((form, index) => {
      if (index === 0) {
        // Dashboard
        return {
          formId: form._id,
          fullAccess: true,
          noAccess: false,
          partialAccess: {
            enabled: false,
            permissions: { view: false, edit: false, add: false, delete: false, applyKpi: false, applyIncrement: false },
          },
        };
      } else if (index === 1) {
        // Roles
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: false, add: false, delete: false, applyKpi: false, applyIncrement: false },
          },
        };
      } else if (index === 2) {
        // Profile
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: true, add: false, delete: false, applyKpi: false, applyIncrement: false },
          },
        };
      } else {
        // Other forms
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: false, add: false, delete: false, applyKpi: false, applyIncrement: false },
          },
        };
      }
    });

    // ✅ Update UserAccessControl with new role + default access
    const result = await db.collection("useraccesscontrol").updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: {
          roleId: new ObjectId(roleId),
          formAccess: formAccessArray,
          updatedAt: new Date(),
        },
      }
    );

    // ✅ Success
    return new Response(
      JSON.stringify({
        message:
          "✅ UserAccessControl updated successfully — role changed, default access applied.",
        userId,
        oldRoleId: existingRoleId,
        newRoleId,
        formCount: formAccessArray.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Update failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
