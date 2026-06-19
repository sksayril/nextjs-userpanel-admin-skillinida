import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICourseModule {
  title: string;
  topics: string;
  progress: number;
  color: string;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  duration: string;
  code: string;
  isPaid: boolean;
  price: number;
  modules: ICourseModule[];
  createdAt: Date;
}

const CourseModuleSchema = new Schema<ICourseModule>({
  title: { type: String, required: true },
  topics: { type: String, required: true },
  progress: { type: Number, default: 0 },
  color: { type: String, default: "from-indigo-500 to-purple-500" },
});

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  modules: [CourseModuleSchema],
  createdAt: { type: Date, default: Date.now },
});

export const Course = models.Course || model<ICourse>("Course", CourseSchema);
