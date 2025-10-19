"use client"

import React, { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { Building2, LayoutDashboard, Users, Clock, Calendar, Mail, LogOut, UserCog, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { showToast } from "@/lib/utils/toast"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SuperAdmin", "HR", "User"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["SuperAdmin"],
  },
  {
    title: "Departments",
    href: "/admin/departments",
    icon: Building2,
    roles: ["SuperAdmin"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Clock,
    roles: ["SuperAdmin", "HR", "User"],
  },
  {
    title: "Leave Requests",
    href: "/leaves",
    icon: Calendar,
    roles: ["SuperAdmin", "HR", "User"],
  },
  {
    title: "Messages",
    href: "/messages",
    icon: Mail,
    roles: ["SuperAdmin", "HR", "User"],
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    roles: ["SuperAdmin"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCog,
    roles: ["SuperAdmin", "HR", "User"],
  },
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: unreadData } = useSWR("/api/messages/unread", fetcher, { refreshInterval: 10000 })
  const previousUnreadCount = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (unreadData?.count !== undefined) {
      if (previousUnreadCount.current !== undefined && unreadData.count > previousUnreadCount.current) {
        showToast("info", "You have a new message", true)
      }
      previousUnreadCount.current = unreadData.count
    }
  }, [unreadData])

  const filteredNavItems = navItems.filter((item) => item.roles.includes(session?.user?.role || ""))

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">EMS</span>
            <span className="text-xs text-muted-foreground">{session?.user?.role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.title === "Messages" && unreadData?.count > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}
