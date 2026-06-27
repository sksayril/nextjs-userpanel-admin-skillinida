import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IQuizQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  marks?: number;
}

export interface IQuiz extends Document {
  title: string;
  course: string;
  questions: IQuizQuestion[];
  scheduledAt: Date;
  duration: number; // in minutes
  assignedStudents: mongoose.Types.ObjectId[];
  examPassword?: string;
  showResultToStudent: boolean;
  enableCertificate: boolean;
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  marks: { type: Number, required: true, default: 1 },
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  course: { type: String, required: true, index: true },
  questions: [QuizQuestionSchema],
  scheduledAt: { type: Date, default: Date.now },
  duration: { type: Number, required: true, default: 30 },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: "Candidate" }],
  examPassword: { type: String },
  showResultToStudent: { type: Boolean, default: true },
  enableCertificate: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = models.Quiz || model<IQuiz>("Quiz", QuizSchema);
