import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Message } from "@/lib/models/Message"
import { User } from "@/lib/models/User"
import { createAuditLog } from "@/lib/utils/audit-log"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const box = searchParams.get("box") || "inbox"

    await connectDB()

    let messages

    const baseQuery = { parentMessage: { $exists: false } } // Only fetch root messages

    if (box === "sent") {
      messages = await Message.find({ ...baseQuery, from: session.user.id })
        .populate("from", "name email")
        .populate("toUser", "name email")
        .populate("toDepartment", "name")
        .sort({ createdAt: -1 })
    } else {
      const user = await User.findById(session.user.id)
      const query: any = {
        ...baseQuery,
        $or: [{ toUser: session.user.id }],
      }
      if (user?.department) {
        query.$or.push({ toDepartment: user.department })
      }
      messages = await Message.find(query)
        .populate("from", "name email")
        .populate("toUser", "name email")
        .populate("toDepartment", "name")
        .sort({ createdAt: -1 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("  Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { toUser, toDepartment, subject, messageBody, parentMessageId } = body

    if (!toUser && !toDepartment) {
      return NextResponse.json({ error: "Recipient required" }, { status: 400 })
    }

    await connectDB()

    if (toDepartment && session.user.role === "User") {
      return NextResponse.json({ error: "Only HR and SuperAdmin can send department messages" }, { status: 403 })
    }

    let parentMessage = null
    let rootMessage = null

    if (parentMessageId) {
      parentMessage = await Message.findById(parentMessageId)
      if (parentMessage) {
        rootMessage = parentMessage.rootMessage || parentMessage._id
      }
    }

    const message = await Message.create({
      from: session.user.id,
      toUser: toUser || undefined,
      toDepartment: toDepartment || undefined,
      subject,
      body: messageBody,
      read: false,
      parentMessage: parentMessage?._id,
      rootMessage: rootMessage,
    })

    // Mark parent as unread for the recipient
    if (parentMessage) {
      const recipientField = parentMessage.from.toString() === session.user.id ? "toUser" : "from"
      await Message.updateMany(
        { rootMessage: rootMessage, read: true, toUser: parentMessage[recipientField] },
        { read: false },
      )
    }

    await createAuditLog("Message sent", session.user.id, {
      messageId: message._id,
      toUser,
      toDepartment,
      isReply: !!parentMessageId,
    })

    const populatedMessage = await Message.findById(message._id)
      .populate("from", "name email")
      .populate("toUser", "name email")
      .populate("toDepartment", "name")

    return NextResponse.json(populatedMessage, { status: 201 })
  } catch (error) {
    console.error("  Error creating message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
