"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Check, X, Calendar, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { showToast } from "@/lib/utils/toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LeavesPage() {
  const { data: session } = useSession()
  const { data: leaves, mutate } = useSWR("/api/leaves", fetcher)
  const { data: stats } = useSWR("/api/leaves/stats", fetcher)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to create leave request")

      showToast("success", "Leave request submitted successfully")
      setIsCreateOpen(false)
      setFormData({ type: "Casual", startDate: "", endDate: "", reason: "" })
      mutate()
    } catch (error) {
      showToast("error", "Error submitting leave request")
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      })

      if (!res.ok) throw new Error("Failed to approve leave")

      showToast("success", "Leave approved successfully", true)
      mutate()
    } catch (error) {
      showToast("error", "Error approving leave")
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      })

      if (!res.ok) throw new Error("Failed to reject leave")

      showToast("warning", "Leave rejected", true)
      mutate()
    } catch (error) {
      showToast("error", "Error rejecting leave")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return

    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" })

      if (!res.ok) throw new Error("Failed to delete leave")

      showToast("success", "Leave deleted successfully")
      mutate()
    } catch (error) {
      showToast("error", "Error deleting leave")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/10 text-green-500"
      case "Rejected":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-yellow-500/10 text-yellow-500"
    }
  }

  const canManageLeaves = session?.user?.role === "HR" || session?.user?.role === "SuperAdmin"

  const pendingLeaves = leaves?.filter((l: any) => l.status === "Pending") || []
  const approvedLeaves = leaves?.filter((l: any) => l.status === "Approved") || []
  const rejectedLeaves = leaves?.filter((l: any) => l.status === "Rejected") || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
            <p className="text-muted-foreground">Manage leave applications and approvals</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Submit a new leave request</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual Leave</SelectItem>
                      <SelectItem value="Sick">Sick Leave</SelectItem>
                      <SelectItem value="Annual">Annual Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingLeaves.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedLeaves.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedLeaves.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingLeaves.map((leave: any) => (
              <motion.div
                key={leave._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{leave.user?.name || "Unknown User"}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{leave.user?.email}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {leave.type}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Duration:</span> {format(new Date(leave.startDate), "MMM d")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canManageLeaves ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleApprove(leave._id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReject(leave._id)}>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(leave._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {pendingLeaves.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">No pending leave requests</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedLeaves.map((leave: any) => (
              <motion.div
                key={leave._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{leave.user?.name || "Unknown User"}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{leave.user?.email}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {leave.type}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Duration:</span> {format(new Date(leave.startDate), "MMM d")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </p>
                      {leave.approvedBy && (
                        <p className="text-sm">
                          <span className="font-medium">Approved by:</span> {leave.approvedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {approvedLeaves.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">No approved leave requests</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedLeaves.map((leave: any) => (
              <motion.div
                key={leave._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{leave.user?.name || "Unknown User"}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{leave.user?.email}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {leave.type}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Duration:</span> {format(new Date(leave.startDate), "MMM d")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </p>
                      {leave.approvedBy && (
                        <p className="text-sm">
                          <span className="font-medium">Rejected by:</span> {leave.approvedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {rejectedLeaves.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">No rejected leave requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
