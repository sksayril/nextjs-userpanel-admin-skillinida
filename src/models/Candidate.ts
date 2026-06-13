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
  createdAt: { type: Date, default: Date.now },
});

export const Candidate = models.Candidate || model<ICandidate>("Candidate", CandidateSchema);
