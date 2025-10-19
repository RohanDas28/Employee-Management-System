import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Attendance } from "@/lib/models/Attendance"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "SuperAdmin" && session.user.role !== "HR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Count today's check-ins
    const todayCheckIns = await Attendance.countDocuments({
      checkIn: { $gte: today },
    })

    // Count active (not checked out)
    const activeCheckIns = await Attendance.countDocuments({
      checkOut: null,
    })

    // Get this month's average hours
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthAttendance = await Attendance.find({
      checkIn: { $gte: firstDayOfMonth },
      checkOut: { $ne: null },
    })

    const avgHours =
      monthAttendance.length > 0
        ? monthAttendance.reduce((sum, att) => sum + (att.totalHours || 0), 0) / monthAttendance.length
        : 0

    return NextResponse.json({
      todayCheckIns,
      activeCheckIns,
      avgHoursThisMonth: Number(avgHours.toFixed(2)),
    })
  } catch (error) {
    console.error("  Error fetching attendance stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
