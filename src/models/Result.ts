import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IResult extends Document {
  candidateId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  correctCount: number;
  incorrectCount: number;
  answers?: number[];
  date: Date;
}

const ResultSchema = new Schema<IResult>({
  candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  quizTitle: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  grade: { type: String, required: true },
  correctCount: { type: Number, required: true, default: 0 },
  incorrectCount: { type: Number, required: true, default: 0 },
  answers: { type: [Number], default: [] },
  date: { type: Date, default: Date.now },
});

export const Result = models.Result || model<IResult>("Result", ResultSchema);
