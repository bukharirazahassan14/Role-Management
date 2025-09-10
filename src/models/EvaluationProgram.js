import mongoose from "mongoose";

const EvaluationProgramSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    Description: { type: String },
    Weightage: { type: Number, required: true }, // percentage
  },
  { timestamps: true }
);

export default mongoose.models.EvaluationProgram ||
  mongoose.model("EvaluationProgram", EvaluationProgramSchema);
