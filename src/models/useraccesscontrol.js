import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  add: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
});

const partialAccessSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  permissions: { type: permissionSchema, default: () => ({}) },
});

const formAccessSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true }, // ✅ ref fixed to Form
  fullAccess: { type: Boolean, default: false },
  noAccess: { type: Boolean, default: true },
  partialAccess: { type: partialAccessSchema, default: () => ({}) },
});

const userAccessControlSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    formAccess: { type: [formAccessSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "useraccesscontrol", // ✅ prevent pluralization
  }
);

const UserAccessControl =
  mongoose.models.UserAccessControl ||
  mongoose.model("UserAccessControl", userAccessControlSchema);

export default UserAccessControl;
