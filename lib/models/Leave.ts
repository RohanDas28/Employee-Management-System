import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ILeave extends Document {
  user: mongoose.Types.ObjectId
  type: "Sick" | "Casual" | "Annual"
  startDate: Date
  endDate: Date
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  approvedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const LeaveSchema = new Schema<ILeave>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Sick", "Casual", "Annual"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

export const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>("Leave", LeaveSchema)
