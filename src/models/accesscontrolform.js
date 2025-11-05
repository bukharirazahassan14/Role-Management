import mongoose from "mongoose";

const AccessControlFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

// ✅ Important: The third argument "AccessControlForm" ensures it uses this exact collection name
const accesscontrolform =
  mongoose.models.accesscontrolform ||
  mongoose.model("accesscontrolform", AccessControlFormSchema, "accesscontrolform");

export default accesscontrolform;
