import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Department } from "@/lib/models/Department"
import { Attendance } from "@/lib/models/Attendance"
import { Leave } from "@/lib/models/Leave"
import { Message } from "@/lib/models/Message"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Common stats for all roles
    const stats: any = {}

    if (session.user.role === "SuperAdmin" || session.user.role === "HR") {
      // Admin/HR stats
      const [totalUsers, totalDepartments, todayAttendance, pendingLeaves, unreadMessages] = await Promise.all([
        User.countDocuments(),
        Department.countDocuments(),
        Attendance.countDocuments({ checkIn: { $gte: today } }),
        Leave.countDocuments({ status: "Pending" }),
        Message.countDocuments({ toUser: session.user.id, read: false }),
      ])

      // Get recent activities
      const recentLeaves = await Leave.find().populate("user", "name email").sort({ createdAt: -1 }).limit(5)

      const recentAttendance = await Attendance.find().populate("user", "name email").sort({ checkIn: -1 }).limit(5)

      stats.totalUsers = totalUsers
      stats.totalDepartments = totalDepartments
      stats.todayAttendance = todayAttendance
      stats.pendingLeaves = pendingLeaves
      stats.unreadMessages = unreadMessages
      stats.recentLeaves = recentLeaves
      stats.recentAttendance = recentAttendance
    } else {
      // User stats
      const user = await User.findById(session.user.id)

      const [myAttendance, myLeaves, unreadMessages] = await Promise.all([
        Attendance.countDocuments({ user: session.user.id }),
        Leave.countDocuments({ user: session.user.id }),
        Message.countDocuments({
          $or: [{ toUser: session.user.id }, { toDepartment: user?.department }],
          read: false,
        }),
      ])

      const myPendingLeaves = await Leave.countDocuments({ user: session.user.id, status: "Pending" })

      const myRecentAttendance = await Attendance.find({ user: session.user.id }).sort({ checkIn: -1 }).limit(5)

      const myRecentLeaves = await Leave.find({ user: session.user.id }).sort({ createdAt: -1 }).limit(5)

      stats.myAttendance = myAttendance
      stats.myLeaves = myLeaves
      stats.myPendingLeaves = myPendingLeaves
      stats.unreadMessages = unreadMessages
      stats.myRecentAttendance = myRecentAttendance
      stats.myRecentLeaves = myRecentLeaves
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("  Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
