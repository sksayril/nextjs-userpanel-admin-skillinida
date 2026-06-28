import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ILiveClass extends Document {
  className: string;
  course: string;
  students: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  meetLink: string;
  createdAt: Date;
}

const LiveClassSchema = new Schema<ILiveClass>({
  className: { type: String, required: true },
  course: { type: String, required: true },
  students: [{ type: Schema.Types.ObjectId, ref: "Candidate", required: true }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetLink: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const LiveClass = models.LiveClass || model<ILiveClass>("LiveClass", LiveClassSchema);
