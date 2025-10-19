import { connectDB } from "../mongodb"
import { AuditLog } from "../models/AuditLog"

export async function createAuditLog(action: string, performedBy: string, metadata?: Record<string, any>) {
  try {
    await connectDB()
    await AuditLog.create({
      action,
      performedBy,
      metadata,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}
