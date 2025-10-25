import connectToDB from "@/lib/mongodb.js";
import Role from "@/models/Role.js";

// ✅ GET all roles
export async function GET(req) {
  try {
    await connectToDB();

    const roles = await Role.find().lean();

    const formatted = roles.map((r) => ({
      _id: r._id.toString(),
      name: r.name,
      description: r.description,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ POST - Create new role (validate unique name)
export async function POST(req) {
  try {
    await connectToDB();

    const { name, description } = await req.json();

    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: "Name and description are required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🔹 Check if role name already exists (case-insensitive)
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "Role name already exists." }),
        {
          status: 409, // Conflict
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Create new role
    const newRole = new Role({ name, description });
    await newRole.save();

    return new Response(
      JSON.stringify({
        message: "Role created successfully.",
        role: {
          _id: newRole._id.toString(),
          name: newRole.name,
          description: newRole.description,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
