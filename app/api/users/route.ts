import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const users = await User.find().populate("department").select("-password").sort({ createdAt: -1 })

    return NextResponse.json(users)
  } catch (error) {
    console.error("  Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, department } = body

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || undefined,
    })

    await createAuditLog("User created", session.user.id, {
      userId: user._id,
      email: user.email,
      role: user.role,
    })

    const populatedUser = await User.findById(user._id).populate("department").select("-password")

    return NextResponse.json(populatedUser, { status: 201 })
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 })
    }
    console.error("  Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
