import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Department } from "@/lib/models/Department"
import { User } from "@/lib/models/User"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    await connectDB()

    const department = await Department.findByIdAndUpdate(id, body, { new: true }).populate("users", "name email role")

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    await createAuditLog("Department updated", session.user.id, {
      departmentId: id,
      changes: body,
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error("  Error updating department:", error)
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await connectDB()

    const department = await Department.findById(id)
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Remove department reference from users
    await User.updateMany({ department: id }, { $unset: { department: "" } })

    await Department.findByIdAndDelete(id)

    await createAuditLog("Department deleted", session.user.id, {
      departmentId: id,
      name: department.name,
    })

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("  Error deleting department:", error)
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 })
  }
}
