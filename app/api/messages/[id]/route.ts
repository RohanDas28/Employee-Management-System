import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectDB } from "@/lib/mongodb"
import { Message } from "@/lib/models/Message"

async function getFullThread(rootMessageId: string) {
  const thread = await Message.find({
    $or: [{ _id: rootMessageId }, { rootMessage: rootMessageId }],
  })
    .populate("from", "name email")
    .populate("toUser", "name email")
    .populate("toDepartment", "name")
    .sort({ createdAt: 1 })

  return thread
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const message = await Message.findById(params.id)
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const rootMessageId = (message.rootMessage || message._id) as string
    const thread = await getFullThread(rootMessageId)

    return NextResponse.json(thread)
  } catch (error) {
    console.error("  Error fetching message thread:", error)
    return NextResponse.json({ error: "Failed to fetch message thread" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const message = await Message.findById(params.id)
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Mark the entire thread as read
    const rootMessageId = (message.rootMessage || message._id) as string
    await Message.updateMany({ rootMessage: rootMessageId, toUser: session.user.id }, { read: true })
    await Message.updateOne({ _id: rootMessageId, toUser: session.user.id }, { read: true })

    return NextResponse.json({ message: "Message marked as read" })
  } catch (error) {
    console.error("  Error marking message as read:", error)
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const message = await Message.findById(params.id)
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // For now, only allow deleting root messages if you are the sender
    if (message.from.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the entire thread
    const rootMessageId = (message.rootMessage || message._id) as string
    await Message.deleteMany({ $or: [{ _id: rootMessageId }, { rootMessage: rootMessageId }] })

    return NextResponse.json({ message: "Message thread deleted" })
  } catch (error) {
    console.error("  Error deleting message:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
