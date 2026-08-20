import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountAmount: number;
  maxUses: number;
  usedCount: number;
  course: string;
  expiryDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  discountAmount: { type: Number, required: true, min: 1 },
  maxUses: { type: Number, required: true, min: 1, default: 100 },
  usedCount: { type: Number, default: 0 },
  course: { type: String, default: "ALL" },
  expiryDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Coupon = models.Coupon || model<ICoupon>("Coupon", CouponSchema);
