import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAttendance extends Document {
  candidateId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "leave";
  googleMeetLink?: string;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent", "leave"], required: true },
  googleMeetLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
