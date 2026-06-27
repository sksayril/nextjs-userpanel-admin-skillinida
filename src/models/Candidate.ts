import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  fatherName: string;
  motherName: string;
  dob: Date;
  email: string;
  phone: string;
  address: string;
  district: string;
  admitUrl: string;
  qualificationUrl: string;
  extraQualificationUrl?: string;
  signatureUrl?: string;
  course: string;
  category: string;
  gender: string;
  registrationId: string;
  password?: string;
  originalPassword?: string;
  agentCode?: string | null;
  profilePicUrl?: string | null;
  isPaid: boolean;
  isActive: boolean;
  paymentDetails?: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount: number;
    paidAt: Date;
  };
  createdAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  admitUrl: { type: String, required: true },
  qualificationUrl: { type: String, required: true },
  extraQualificationUrl: { type: String },
  signatureUrl: { type: String },
  course: { type: String, required: true },
  category: { type: String, default: "GEN", enum: ["GEN", "OBC", "SC", "ST"] },
  gender: { type: String, default: "MALE", enum: ["MALE", "FEMALE", "OTHER"] },
  registrationId: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  originalPassword: { type: String },
  agentCode: { type: String, default: null, index: true },
  profilePicUrl: { type: String, default: null },
  isPaid: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  paymentDetails: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    amount: { type: Number },
    paidAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
});

// Compound index: same email can register for different courses, but not the same course twice
CandidateSchema.index({ email: 1, course: 1 }, { unique: true });

export const Candidate = models.Candidate || model<ICandidate>("Candidate", CandidateSchema);
