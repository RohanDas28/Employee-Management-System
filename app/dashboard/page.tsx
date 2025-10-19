"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Clock, Calendar, Mail, TrendingUp, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: stats, mutate } = useSWR("/api/dashboard/stats", fetcher)

  const isAdmin = session?.user?.role === "SuperAdmin" || session?.user?.role === "HR"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "System overview and recent activities" : "Your personal dashboard"}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isAdmin ? (
          <>
            {/* Admin/HR Dashboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Active users in system</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.todayAttendance || 0}</div>
                    <p className="text-xs text-muted-foreground">Checked in today</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingLeaves || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Departments</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalDepartments || 0}</div>
                    <p className="text-xs text-muted-foreground">Active departments</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Leave Requests</CardTitle>
                  <CardDescription>Latest leave applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentLeaves?.map((leave: any) => (
                      <div
                        key={leave._id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{leave.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {leave.type} - {format(new Date(leave.startDate), "MMM d")} to{" "}
                            {format(new Date(leave.endDate), "MMM d")}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            leave.status === "Pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : leave.status === "Approved"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </div>
                    ))}
                    {(!stats?.recentLeaves || stats.recentLeaves.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground">No recent leave requests</p>
                    )}
                  </div>
                  <Link href="/leaves">
                    <Button variant="outline" className="mt-4 w-full bg-transparent">
                      View All Leaves
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Latest check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentAttendance?.map((attendance: any) => (
                      <div
                        key={attendance._id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{attendance.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(attendance.checkIn), "MMM d, HH:mm")}
                            {attendance.checkOut && ` - ${format(new Date(attendance.checkOut), "HH:mm")}`}
                          </p>
                        </div>
                        {attendance.totalHours ? (
                          <span className="text-sm font-medium">{attendance.totalHours}h</span>
                        ) : (
                          <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                    {(!stats?.recentAttendance || stats.recentAttendance.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground">No recent attendance</p>
                    )}
                  </div>
                  <Link href="/attendance">
                    <Button variant="outline" className="mt-4 w-full bg-transparent">
                      View All Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* User Dashboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.myAttendance || 0}</div>
                    <p className="text-xs text-muted-foreground">Total records</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Leaves</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.myLeaves || 0}</div>
                    <p className="text-xs text-muted-foreground">Total requests</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.myPendingLeaves || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.unreadMessages || 0}</div>
                    <p className="text-xs text-muted-foreground">New messages</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Recent Attendance</CardTitle>
                  <CardDescription>Your latest check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.myRecentAttendance?.map((attendance: any) => (
                      <div
                        key={attendance._id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{format(new Date(attendance.checkIn), "EEEE, MMMM d")}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(attendance.checkIn), "HH:mm")}
                            {attendance.checkOut && ` - ${format(new Date(attendance.checkOut), "HH:mm")}`}
                          </p>
                        </div>
                        {attendance.totalHours ? (
                          <span className="text-sm font-medium">{attendance.totalHours}h</span>
                        ) : (
                          <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                    {(!stats?.myRecentAttendance || stats.myRecentAttendance.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground">No attendance records yet</p>
                    )}
                  </div>
                  <Link href="/attendance">
                    <Button variant="outline" className="mt-4 w-full bg-transparent">
                      View All Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Leave Requests</CardTitle>
                  <CardDescription>Your recent leave applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.myRecentLeaves?.map((leave: any) => (
                      <div
                        key={leave._id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{leave.type} Leave</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d")}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            leave.status === "Pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : leave.status === "Approved"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </div>
                    ))}
                    {(!stats?.myRecentLeaves || stats.myRecentLeaves.length === 0) && (
                      <p className="text-center text-sm text-muted-foreground">No leave requests yet</p>
                    )}
                  </div>
                  <Link href="/leaves">
                    <Button variant="outline" className="mt-4 w-full bg-transparent">
                      View All Leaves
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Link href="/attendance">
                    <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 bg-transparent">
                      <Clock className="h-6 w-6" />
                      <span>Mark Attendance</span>
                    </Button>
                  </Link>
                  <Link href="/leaves">
                    <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 bg-transparent">
                      <Calendar className="h-6 w-6" />
                      <span>Apply for Leave</span>
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 bg-transparent">
                      <Mail className="h-6 w-6" />
                      <span>Send Message</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
