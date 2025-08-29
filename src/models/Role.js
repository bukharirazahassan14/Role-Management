import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
});

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
export default Role;
