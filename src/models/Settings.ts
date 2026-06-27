import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISettings extends Document {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  whatsappChannelLink: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  razorpayKeyId: { type: String, default: "" },
  razorpayKeySecret: { type: String, default: "" },
  whatsappChannelLink: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

export const Settings = models.Settings || model<ISettings>("Settings", SettingsSchema);
