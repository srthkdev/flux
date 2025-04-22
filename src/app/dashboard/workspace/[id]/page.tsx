"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, MoreHorizontal, Search } from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkspaceModal } from "@/components/workspace-modal"

interface FormItem {
  id: string
  title: string
  description?: string | null
  updatedAt: Date
  published?: boolean
}

interface WorkspaceData {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string
  const { user, isLoaded } = useUser()

  const [forms, setForms] = useState<FormItem[]>([])
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceId) return

      setIsLoading(true)

      try {
        // Fetch workspace details using API - userId is automatically handled by auth
        const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`)
        if (!workspaceResponse.ok) {
          throw new Error("Failed to fetch workspace details")
        }

        const currentWorkspace = await workspaceResponse.json()

        setWorkspace({
          id: currentWorkspace.id,
          name: currentWorkspace.name,
          createdAt: currentWorkspace.createdAt,
          updatedAt: currentWorkspace.updatedAt,
        })

        // Fetch forms in this workspace using API
        const formsResponse = await fetch(`/api/workspace/${workspaceId}/forms`)
        if (!formsResponse.ok) {
          throw new Error("Failed to fetch workspace forms")
        }

        const workspaceForms = await formsResponse.json()
        setForms(workspaceForms || [])
        setFilteredForms(workspaceForms || [])
      } catch (error) {
        console.error("Error fetching workspace data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [workspaceId, router])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredForms(forms)
    } else {
      const filtered = forms.filter(
        (form) =>
          form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredForms(filtered)
    }
  }, [searchQuery, forms])

  const handleCreateForm = async () => {
    if (!workspace) return

    try {
      const formResponse = await fetch(`/api/workspace/${workspace.id}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled",
          description: "",
        }),
      })

      if (!formResponse.ok) {
        throw new Error("Failed to create form")
      }

      const newForm = await formResponse.json()
      router.push(`/dashboard/forms/${newForm.id}`)
    } catch (error) {
      console.error("Error creating form:", error)
    }
  }

  const handleEditWorkspace = () => {
    if (!workspace) return
    setIsEditModalOpen(true)
  }

  const refreshWorkspace = async () => {
    if (!workspaceId) return

    setIsLoading(true)

    try {
      // Fetch workspace details using API
      const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`)
      if (!workspaceResponse.ok) {
        throw new Error("Failed to fetch workspace details")
      }

      const currentWorkspace = await workspaceResponse.json()

      setWorkspace({
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        createdAt: currentWorkspace.createdAt,
        updatedAt: currentWorkspace.updatedAt,
      })

      // Fetch forms in this workspace using API
      const formsResponse = await fetch(`/api/workspace/${workspaceId}/forms`)
      if (!formsResponse.ok) {
        throw new Error("Failed to fetch workspace forms")
      }

      const workspaceForms = await formsResponse.json()
      setForms(workspaceForms || [])
      setFilteredForms(workspaceForms || [])
    } catch (error) {
      console.error("Error refreshing workspace data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    if (!date) return ""
    return `${new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} ago`
  }

  if (isLoading || !workspace) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 bg-muted/30 rounded animate-pulse w-1/4" />
          <div className="h-10 bg-muted/30 rounded animate-pulse w-32" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium">{workspace.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-60 hover:opacity-100"
              onClick={handleEditWorkspace}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            New form
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-10 bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filteredForms.length > 0 ? (
            filteredForms.map((form) => (
              <div
                key={form.id}
                className="border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/forms/${form.id}`)}
              >
                <div className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium">{form.title}</h3>
                      {!form.published && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Draft</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {form.published && <span>1 submission · </span>}
                      Edited {formatTimeAgo(form.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <p className="text-gray-500">No forms match your search.</p>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No forms yet. Create your first form to get started.</p>
                  <Button onClick={handleCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create form
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Workspace Modal */}
      <WorkspaceModal
        isOpen={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
        }}
        workspaceToEdit={
          workspace
            ? {
                id: workspace.id,
                name: workspace.name,
              }
            : undefined
        }
        onSuccess={refreshWorkspace}
      />
    </div>
  )
}
