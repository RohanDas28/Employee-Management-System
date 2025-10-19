import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Leave } from "@/lib/models/Leave"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "HR" && session.user.role !== "SuperAdmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!["Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectDB()

    const leave = await Leave.findById(id)
    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 })
    }

    leave.status = status
    leave.approvedBy = session.user.id
    await leave.save()

    await createAuditLog(`Leave ${status.toLowerCase()}`, session.user.id, {
      leaveId: id,
      userId: leave.user,
      status,
    })

    const updatedLeave = await Leave.findById(id).populate("user", "name email").populate("approvedBy", "name")

    return NextResponse.json(updatedLeave)
  } catch (error) {
    console.error("  Error updating leave:", error)
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await connectDB()

    const leave = await Leave.findById(id)
    if (!leave) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 })
    }

    // Users can only delete their own pending leaves
    if (session.user.role === "User" && (leave.user.toString() !== session.user.id || leave.status !== "Pending")) {
      return NextResponse.json({ error: "Cannot delete this leave" }, { status: 403 })
    }

    await Leave.findByIdAndDelete(id)

    await createAuditLog("Leave deleted", session.user.id, {
      leaveId: id,
    })

    return NextResponse.json({ message: "Leave deleted successfully" })
  } catch (error) {
    console.error("  Error deleting leave:", error)
    return NextResponse.json({ error: "Failed to delete leave" }, { status: 500 })
  }
}
