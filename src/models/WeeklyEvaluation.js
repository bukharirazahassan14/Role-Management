import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema(
  {
    kpiId: { type: mongoose.Schema.Types.ObjectId, ref: "EvaluationProgram", required: true },
    score: { type: Number, required: true },
    weightage: { type: Number, required: true },
    weightedRating: { type: Number }, // ✅ make optional, auto-calculated
  },
  { _id: false }
);

const WeeklyEvaluationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weekNumber: { type: Number, required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    scores: [ScoreSchema],
    comments: { type: String },
    totalScore: { type: Number }, // ✅ auto-calculated
    totalWeightedRating: { type: Number }, // ✅ auto-calculated
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ✅ Pre-save hook to auto-calculate weightedRating + totals
WeeklyEvaluationSchema.pre("save", function (next) {
  if (this.scores && this.scores.length > 0) {
    this.scores.forEach((s) => {
      s.weightedRating = (s.score * s.weightage) / 100;
    });

    this.totalScore = this.scores.reduce((sum, s) => sum + s.score, 0);
    this.totalWeightedRating = this.scores.reduce((sum, s) => sum + s.weightedRating, 0);
  }
  next();
});

export default mongoose.models.WeeklyEvaluation ||
  mongoose.model("WeeklyEvaluation", WeeklyEvaluationSchema);
