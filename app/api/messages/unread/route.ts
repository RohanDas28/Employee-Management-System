import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Message } from "@/lib/models/Message"
import { User } from "@/lib/models/User"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id)

    const query: any = {
      read: false,
      $or: [{ toUser: session.user.id }],
    }

    if (user?.department) {
      query.$or.push({ toDepartment: user.department })
    }

    const count = await Message.countDocuments(query)

    return NextResponse.json({ count })
  } catch (error) {
    console.error("  Error fetching unread count:", error)
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 })
  }
}
