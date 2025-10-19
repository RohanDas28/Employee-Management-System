"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { format } from "date-fns"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AuditLogsPage() {
  const { data: logs } = useSWR("/api/audit-logs", fetcher)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLogs = logs?.filter((log: any) => log.action.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System activity and change history</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>All system actions and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredLogs?.map((log: any) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-muted-foreground">
                      By {log.performedBy?.name || "System"} - {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                    </p>
                  </div>
                </motion.div>
              ))}
              {(!filteredLogs || filteredLogs.length === 0) && (
                <p className="py-8 text-center text-muted-foreground">No audit logs found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
