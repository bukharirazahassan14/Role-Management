import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    applyKpi: { type: Boolean, default: false },
    applyIncrement: { type: Boolean, default: false },
  },
  { _id: false } // ❌ prevents unwanted _id
);

const partialAccessSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    permissions: { type: permissionSchema, default: () => ({}) },
  },
  { _id: false } // ❌ prevents unwanted _id
);

const formAccessSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
    fullAccess: { type: Boolean, default: false },
    noAccess: { type: Boolean, default: true },
    partialAccess: { type: partialAccessSchema, default: () => ({}) },
  },
  { _id: false } // ❌ prevents: _id inside formAccess[]
);

const userAccessControlSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    formAccess: { type: [formAccessSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "useraccesscontrol",
  }
);

const UserAccessControl =
  mongoose.models.UserAccessControl ||
  mongoose.model("UserAccessControl", userAccessControlSchema);

export default UserAccessControl;
