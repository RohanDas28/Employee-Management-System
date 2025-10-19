import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAuditLog extends Document {
  action: string
  performedBy: mongoose.Types.ObjectId
  timestamp: Date
  metadata?: Record<string, any>
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
})

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
