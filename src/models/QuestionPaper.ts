import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IQuestionPaper extends Document {
  title: string;
  course: string;
  fileUrl: string;
  date: Date;
  status: "solved" | "pending" | "locked";
  score?: string;
  createdAt: Date;
}

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  title: { type: String, required: true },
  course: { type: String, required: true, index: true },
  fileUrl: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["solved", "pending", "locked"], default: "pending" },
  score: { type: String, default: "--" },
  createdAt: { type: Date, default: Date.now },
});

export const QuestionPaper = models.QuestionPaper || model<IQuestionPaper>("QuestionPaper", QuestionPaperSchema);
