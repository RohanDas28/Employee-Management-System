import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Attendance } from "@/lib/models/Attendance"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find today's attendance without checkout
    const activeAttendance = await Attendance.findOne({
      user: session.user.id,
      checkOut: null,
    }).sort({ checkIn: -1 })

    return NextResponse.json({
      isCheckedIn: !!activeAttendance,
      attendance: activeAttendance,
    })
  } catch (error) {
    console.error("  Error fetching attendance status:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
