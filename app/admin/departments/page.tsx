"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DepartmentsPage() {
  const { data: departments, mutate } = useSWR("/api/departments", fetcher)
  const { toast } = useToast()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to create department")

      toast({ title: "Department created successfully" })
      setIsCreateOpen(false)
      setFormData({ name: "", description: "" })
      mutate()
    } catch (error) {
      toast({ title: "Error creating department", variant: "destructive" })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`/api/departments/${selectedDept._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to update department")

      toast({ title: "Department updated successfully" })
      setIsEditOpen(false)
      setSelectedDept(null)
      mutate()
    } catch (error) {
      toast({ title: "Error updating department", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" })

      if (!res.ok) throw new Error("Failed to delete department")

      toast({ title: "Department deleted successfully" })
      mutate()
    } catch (error) {
      toast({ title: "Error deleting department", variant: "destructive" })
    }
  }

  const openEditDialog = (dept: any) => {
    setSelectedDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || "",
    })
    setIsEditOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">Manage organizational departments</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>Add a new department to the organization</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Department
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments?.map((dept: any) => (
            <motion.div
              key={dept._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{dept.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{dept.description || "No description"}</p>
                </div>
              </div>
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{dept.users?.length || 0} members</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => openEditDialog(dept)}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(dept._id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Update Department
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
