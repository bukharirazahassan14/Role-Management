import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true, 
    maxlength: 50 
  }, // 1: First Name

  lastName: { 
    type: String, 
    required: true, 
    maxlength: 50 
  }, // 2: Last Name

  primaryEmail: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 100 
  }, // 3: Primary Email

  secondaryEmail: { 
    type: String, 
    maxlength: 100 
  }, // 4: Secondary Email

  fatherName: { 
    type: String, 
    maxlength: 100 
  }, // 5: Father Name

  phone: { 
    type: String, 
    maxlength: 15 
  }, // 6: Phone

  emergencyContact: { 
    type: String, 
    maxlength: 15 
  }, // 7: Emergency Contact

  emergencyRelation: { 
    type: String, 
    maxlength: 50 
  }, // 8: Emergency Contact Relation

  cnic: { 
    type: String, 
    maxlength: 15 
  }, // 9: CNIC

  role: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Role", 
    required: true 
  }, // 10: Role Reference

  joiningDate: { 
    type: Date, 
    required: true 
  }, // 11: Joining Date

  medicalCondition: { 
    type: String, 
    maxlength: 200 
  }, // 12: Medical Condition

  jd: { 
    type: String, 
    maxlength: 1000 
  }, // 13: Job Description

  exp: { 
    type: String, 
    maxlength: 500 
  }, // 14: Experience

   accHolderName: {
    type: String,
    maxlength: 100,
  }, // Account Holder Name

  accNumber: {
    type: String,
    maxlength: 24,
  }, // Bank Account Number

  bankName: {
    type: String,
    maxlength: 100,
  }, // Bank Name

  iban: {
    type: String,
    maxlength: 34,
  }, // IBAN

  password: { 
    type: String, 
    maxlength: 128 
  },

  isActive: { 
    type: Boolean, 
    default: true 
  },

  created_at: { 
    type: Date, 
    default: Date.now 
  },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
