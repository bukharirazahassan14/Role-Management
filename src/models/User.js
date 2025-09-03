import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },                 // 1: First Name
  lastName: { type: String, required: true },                  // 2: Last Name
  primaryEmail: { type: String, required: true, unique: true }, // 3: Primary Email
  secondaryEmail: { type: String },                            // 4: Secondary Email
  fatherName: { type: String },                                // 5: Father Name
  phone: { type: String },                                     // 6: Phone
  emergencyContact: { type: String },                          // 7: Emergency Contact
  emergencyRelation: { type: String },                         // 8: Emergency Contact relation
  cnic: { type: String },                                      // 9: CNIC
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, // 10: Role
  medicalCondition: { type: String },                          // 11: Medical Condition
  jd: { type: String },                                        // 12: JD (Job Description)
  exp: { type: String },                                       // 13: Exp (Experience)
  password: { type: String },
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
