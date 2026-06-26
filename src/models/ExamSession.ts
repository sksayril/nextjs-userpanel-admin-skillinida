import mongoose, { Schema, Document, model, models } from "mongoose";

export type ExamSessionStatus = "in_progress" | "submitted" | "expired";

export interface IExamSession extends Document {
  candidateId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: number[];
  startedAt: Date;
  lastSavedAt: Date;
  windowEndsAt: Date;
  status: ExamSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSessionSchema = new Schema<IExamSession>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    answers: { type: [Number], default: [] },
    startedAt: { type: Date, required: true },
    lastSavedAt: { type: Date, required: true },
    windowEndsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress",
    },
  },
  { timestamps: true }
);

ExamSessionSchema.index({ candidateId: 1, quizId: 1 }, { unique: true });

export const ExamSession =
  models.ExamSession || model<IExamSession>("ExamSession", ExamSessionSchema);
