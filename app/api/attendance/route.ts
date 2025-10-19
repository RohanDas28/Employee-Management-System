import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Attendance } from "@/lib/models/Attendance"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    await connectDB()

    const query: any = {}

    // Regular users can only see their own attendance
    if (session.user.role === "User") {
      query.user = session.user.id
    } else if (userId) {
      // HR and SuperAdmin can filter by user
      query.user = userId
    }

    if (startDate && endDate) {
      query.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const attendance = await Attendance.find(query).populate("user", "name email").sort({ checkIn: -1 }).limit(100)

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("  Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // "checkin" or "checkout"

    await connectDB()

    if (action === "checkin") {
      // Check if already checked in today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingAttendance = await Attendance.findOne({
        user: session.user.id,
        checkIn: { $gte: today },
        checkOut: null,
      })

      if (existingAttendance) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 })
      }

      const attendance = await Attendance.create({
        user: session.user.id,
        checkIn: new Date(),
      })

      await createAuditLog("Check-in", session.user.id, {
        attendanceId: attendance._id,
      })

      return NextResponse.json(attendance, { status: 201 })
    } else if (action === "checkout") {
      // Find today's attendance without checkout
      const attendance = await Attendance.findOne({
        user: session.user.id,
        checkOut: null,
      }).sort({ checkIn: -1 })

      if (!attendance) {
        return NextResponse.json({ error: "No active check-in found" }, { status: 400 })
      }

      attendance.checkOut = new Date()
      await attendance.save()

      await createAuditLog("Check-out", session.user.id, {
        attendanceId: attendance._id,
        totalHours: attendance.totalHours,
      })

      return NextResponse.json(attendance)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("  Error managing attendance:", error)
    return NextResponse.json({ error: "Failed to manage attendance" }, { status: 500 })
  }
}
