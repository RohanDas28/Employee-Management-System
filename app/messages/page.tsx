"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Mail, Send, Trash2, MailOpen } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { showToast } from "@/lib/utils/toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MessagesPage() {
  const { data: session } = useSession()
  const [box, setBox] = useState("inbox")
  const { data: messages, mutate } = useSWR(`/api/messages?box=${box}`, fetcher)
  const { data: users } = useSWR("/api/users", fetcher)
  const { data: departments } = useSWR("/api/departments", fetcher)
  const { data: unreadData } = useSWR("/api/messages/unread", fetcher, { refreshInterval: 30000 })

  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState<any[] | null>(null)
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    recipientType: "user",
    toUser: "",
    toDepartment: "",
    subject: "",
    messageBody: "",
    parentMessageId: null,
  })

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload: any = {
        subject: formData.subject,
        messageBody: formData.messageBody,
        parentMessageId: formData.parentMessageId,
      }

      if (formData.recipientType === "user") {
        payload.toUser = formData.toUser
      } else {
        payload.toDepartment = formData.toDepartment
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to send message")

      showToast("success", "Message sent successfully", true)
      setIsComposeOpen(false)
      setFormData({
        recipientType: "user",
        toUser: "",
        toDepartment: "",
        subject: "",
        messageBody: "",
        parentMessageId: null,
      })
      mutate()
      // If we were in a thread view, refresh it
      if (selectedThread) {
        openMessage(selectedThread[0])
      }
    } catch (error) {
      showToast("error", "Error sending message")
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/messages/${id}`, {
        method: "PATCH",
      })
      mutate()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message thread?")) return

    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" })

      if (!res.ok) throw new Error("Failed to delete message thread")

      showToast("success", "Message thread deleted successfully")
      mutate()
      setSelectedThread(null)
    } catch (error) {
      showToast("error", "Error deleting message thread")
    }
  }

  const openMessage = async (message: any) => {
    try {
      const thread = await fetcher(`/api/messages/${message._id}`)
      setSelectedThread(thread)
      if (!message.read && box === "inbox") {
        handleMarkAsRead(message._id)
      }
    } catch (error) {
      showToast("error", "Failed to load message thread")
    }
  }

  const handleReply = (message: any) => {
    const originalSenderId = message.from._id
    const subject = message.subject.startsWith("Re: ") ? message.subject : `Re: ${message.subject}`
    const body = `\n\n--- On ${format(new Date(message.createdAt), "MMM d, yyyy, HH:mm")}, ${
      message.from.name
    } wrote: ---\n>${message.body.replace(/\n/g, "\n> ")}`

    setFormData({
      recipientType: "user",
      toUser: originalSenderId,
      toDepartment: "",
      subject: subject,
      messageBody: body,
      parentMessageId: message._id,
    })
    setIsComposeOpen(true)
  }

  const canSendToDepartment = session?.user?.role === "HR" || session?.user?.role === "SuperAdmin"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Internal communication and announcements</p>
          </div>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{formData.parentMessageId ? "Reply to Message" : "Compose Message"}</DialogTitle>
                <DialogDescription>
                  {formData.parentMessageId ? "Send a reply" : "Send a message to a user or department"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select
                    value={formData.recipientType}
                    onValueChange={(value) => setFormData({ ...formData, recipientType: value })}
                    disabled={!!formData.parentMessageId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      {canSendToDepartment && <SelectItem value="department">Department</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {formData.recipientType === "user" ? (
                  <div className="space-y-2">
                    <Label>To User</Label>
                    <Select
                      value={formData.toUser}
                      onValueChange={(value) => setFormData({ ...formData, toUser: value })}
                      disabled={!!formData.parentMessageId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(users) &&
                          users.map((user: any) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>To Department</Label>
                    <Select
                      value={formData.toDepartment}
                      onValueChange={(value) => setFormData({ ...formData, toDepartment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept: any) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="messageBody">Message</Label>
                  <Textarea
                    id="messageBody"
                    value={formData.messageBody}
                    onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={box} onValueChange={setBox} className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">
              <Mail className="mr-2 h-4 w-4" />
              Inbox {unreadData?.count > 0 && `(${unreadData.count})`}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="mr-2 h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {messages?.map((message: any) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => openMessage(message)}
                        className={`cursor-pointer border-b border-border p-4 transition-colors hover:bg-accent ${
                          selectedThread && selectedThread[0]?._id === message._id ? "bg-accent" : ""
                        } ${!message.read && box === "inbox" ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium">
                                {box === "inbox"
                                  ? message.from?.name
                                  : message.toUser?.name || message.toDepartment?.name}
                              </p>
                              {!message.read && box === "inbox" && (
                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{message.subject}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), "MMM d, HH:mm")}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {messages?.length === 0 && <div className="p-8 text-center text-muted-foreground">No messages</div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedThread ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{selectedThread[0].subject}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleReply(selectedThread.at(-1))}>
                          <Send className="mr-2 h-4 w-4" />
                          Reply
                        </Button>
                        {box === "sent" && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedThread[0]._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[550px] space-y-4 overflow-y-auto">
                    {selectedThread.map((message: any, index: number) => (
                      <div key={message._id} className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <p className="font-medium">
                            {message.from.name} ({message.from.email})
                          </p>
                          <p>{format(new Date(message.createdAt), "MMMM d, yyyy 'at' HH:mm")}</p>
                        </div>
                        <div className="whitespace-pre-wrap">{message.body}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex h-[600px] items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MailOpen className="mx-auto mb-4 h-12 w-12" />
                      <p>Select a message to read</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
