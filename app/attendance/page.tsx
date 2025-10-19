"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, LogIn, LogOut, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { showToast } from "@/lib/utils/toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AttendancePage() {
  const { data: session } = useSession()
  const { data: statusData, mutate: mutateStatus } = useSWR("/api/attendance/status", fetcher, {
    refreshInterval: 30000,
  })
  const { data: attendance, mutate: mutateAttendance } = useSWR("/api/attendance", fetcher)
  const { data: stats } = useSWR(session?.user?.role !== "User" ? "/api/attendance/stats" : null, fetcher)

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCheckIn = async () => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      showToast("success", "Checked in successfully")
      mutateStatus()
      mutateAttendance()
    } catch (error: any) {
      showToast("error", error.message || "Error checking in")
    }
  }

  const handleCheckOut = async () => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      showToast("success", "Checked out successfully")
      mutateStatus()
      mutateAttendance()
    } catch (error: any) {
      showToast("error", error.message || "Error checking out")
    }
  }

  const calculateDuration = (checkIn: string) => {
    const start = new Date(checkIn)
    const diff = currentTime.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track your work hours and attendance</p>
        </div>

        {session?.user?.role !== "User" && stats && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <LogIn className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCheckIns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Hours (Month)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgHoursThisMonth}h</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle>Attendance Hub</CardTitle>
            <CardDescription>Your central point for managing attendance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center space-y-4 border-b border-border p-8 md:border-b-0 md:border-r">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Time</p>
                  <p className="text-5xl font-bold tracking-tighter">{format(currentTime, "HH:mm:ss")}</p>
                  <p className="text-muted-foreground">{format(currentTime, "EEEE, MMMM d, yyyy")}</p>
                </div>
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>

              <div className="flex flex-col items-center justify-center p-8">
                {statusData?.isCheckedIn ? (
                  <div className="flex w-full flex-col items-center space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Checked in at</p>
                      <p className="text-3xl font-bold">
                        {format(new Date(statusData.attendance.checkIn), "HH:mm:ss")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-3xl font-bold">{calculateDuration(statusData.attendance.checkIn)}</p>
                    </div>
                    <Button onClick={handleCheckOut} className="w-full max-w-xs" size="lg">
                      <LogOut className="mr-2 h-5 w-5" />
                      Check Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center space-y-4">
                    <p className="text-center text-muted-foreground">You are currently checked out.</p>
                    <Button onClick={handleCheckIn} className="w-full max-w-xs animate-pulse" size="lg">
                      <LogIn className="mr-2 h-5 w-5" />
                      Check In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendance?.map((record: any) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{format(new Date(record.checkIn), "MMMM d, yyyy")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.checkIn), "HH:mm")} -{" "}
                      {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "Active"}
                    </p>
                  </div>
                  <div className="text-right">
                    {record.totalHours ? (
                      <>
                        <p className="font-semibold">{record.totalHours}h</p>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                      </>
                    ) : (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                        Active
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
