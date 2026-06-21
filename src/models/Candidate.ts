import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  fatherName: string;
  motherName: string;
  dob: Date;
  email: string;
  phone: string;
  address: string;
  admitUrl: string;
  qualificationUrl: string;
  extraQualificationUrl?: string;
  course: string;
  registrationId: string;
  password?: string;
  agentCode?: string | null;
  profilePicUrl?: string | null;
  isPaid: boolean;
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
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  admitUrl: { type: String, required: true },
  qualificationUrl: { type: String, required: true },
  extraQualificationUrl: { type: String },
  course: { type: String, required: true },
  registrationId: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  agentCode: { type: String, default: null, index: true },
  profilePicUrl: { type: String, default: null },
  isPaid: { type: Boolean, default: false },
  paymentDetails: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    amount: { type: Number },
    paidAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
});

export const Candidate = models.Candidate || model<ICandidate>("Candidate", CandidateSchema);
