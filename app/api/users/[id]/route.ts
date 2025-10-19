import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
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

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update fields
    if (body.name) user.name = body.name
    if (body.email) user.email = body.email
    if (body.role) user.role = body.role
    if (body.department !== undefined) user.department = body.department || undefined
    if (body.password) user.password = body.password

    await user.save()

    await createAuditLog("User updated", session.user.id, {
      userId: user._id,
      changes: body,
    })

    const updatedUser = await User.findById(id).populate("department").select("-password")

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
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

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await User.findByIdAndDelete(id)

    await createAuditLog("User deleted", session.user.id, {
      userId: id,
      email: user.email,
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
