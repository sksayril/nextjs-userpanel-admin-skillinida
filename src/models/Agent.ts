import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAgent extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  originalPassword?: string;
  agentCode: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  originalPassword: { type: String, required: true },
  agentCode: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Agent = models.Agent || model<IAgent>("Agent", AgentSchema);
