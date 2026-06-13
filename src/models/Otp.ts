import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IOtp extends Document {
  email: string;
  code: string;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Auto-deletes after 5 minutes (300 seconds)
});

export const Otp = models.Otp || model<IOtp>("Otp", OtpSchema);
