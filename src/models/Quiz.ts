import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IQuizQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface IQuiz extends Document {
  title: string;
  course: string;
  questions: IQuizQuestion[];
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  course: { type: String, required: true, index: true },
  questions: [QuizQuestionSchema],
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = models.Quiz || model<IQuiz>("Quiz", QuizSchema);
