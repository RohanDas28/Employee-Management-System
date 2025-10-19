import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Leave } from "@/lib/models/Leave"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    await connectDB()

    const query: any = {}

    // Regular users can only see their own leaves
    if (session.user.role === "User") {
      query.user = session.user.id
    }

    if (status) {
      query.status = status
    }

    const leaves = await Leave.find(query)
      .populate("user", "name email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error("  Error fetching leaves:", error)
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, startDate, endDate, reason } = body

    await connectDB()

    const leave = await Leave.create({
      user: session.user.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "Pending",
    })

    await createAuditLog("Leave request created", session.user.id, {
      leaveId: leave._id,
      type,
      startDate,
      endDate,
    })

    const populatedLeave = await Leave.findById(leave._id).populate("user", "name email")

    return NextResponse.json(populatedLeave, { status: 201 })
  } catch (error) {
    console.error("  Error creating leave:", error)
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 })
  }
}
