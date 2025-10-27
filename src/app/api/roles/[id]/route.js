import connectToDB from "@/lib/mongodb.js";
import Role from "@/models/Role.js";
import User from "@/models/User.js";

// ✅ PUT - Update role by ID (with unique name validation)
export async function PUT(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params; // ✅ Await params for Next.js 15
    const { name, description } = await req.json();

    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: "Name and description are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔹 Check uniqueness (ignore same record)
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: id },
    });

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "Role name already exists." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedRole) {
      return new Response(JSON.stringify({ error: "Role not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Role updated successfully.",
        role: updatedRole,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating role:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ DELETE - Delete role by ID (with user check)
export async function DELETE(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params; // ✅ Await params for Next.js 15

    // 🔍 Check if any user has this role
    const userWithRole = await User.findOne({ role: id });

    if (userWithRole) {
      return new Response(
        JSON.stringify({
          error:
            "Cannot delete role — it is assigned to one or more users.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🗑️ Proceed to delete if not assigned
    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return new Response(JSON.stringify({ error: "Role not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Role deleted successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting role:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
