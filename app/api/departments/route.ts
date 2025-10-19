import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Department } from "@/lib/models/Department"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const departments = await Department.find().populate("users", "name email role").sort({ createdAt: -1 })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("  Error fetching departments:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    await connectDB()

    const existingDept = await Department.findOne({ name })
    if (existingDept) {
      return NextResponse.json({ error: "Department already exists" }, { status: 400 })
    }

    const department = await Department.create({
      name,
      description,
    })

    await createAuditLog("Department created", session.user.id, {
      departmentId: department._id,
      name: department.name,
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error("  Error creating department:", error)
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
  }
}
