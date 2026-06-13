import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  password?: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Admin = models.Admin || model<IAdmin>("Admin", AdminSchema);
