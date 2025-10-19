import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Leave } from "@/lib/models/Leave"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const query: any = {}

    // Users see only their own stats
    if (session.user.role === "User") {
      query.user = session.user.id
    }

    const [pending, approved, rejected] = await Promise.all([
      Leave.countDocuments({ ...query, status: "Pending" }),
      Leave.countDocuments({ ...query, status: "Approved" }),
      Leave.countDocuments({ ...query, status: "Rejected" }),
    ])

    return NextResponse.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    })
  } catch (error) {
    console.error("  Error fetching leave stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
