"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, MoreHorizontal, Search, Trash2, Edit } from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkspaceModal } from "@/components/workspace-modal"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { useData } from "@/contexts/DataContext"

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
  const { forceRefresh } = useData()

  const [forms, setForms] = useState<FormItem[]>([])
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteWorkspaceDialog, setShowDeleteWorkspaceDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formActionInProgress, setFormActionInProgress] = useState<Record<string, boolean>>({})

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

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;
    
    setIsDeleting(true);
    
    try {
      // First, move all forms in this workspace to trash
      const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms`);
      if (formsResponse.ok) {
        const workspaceForms = await formsResponse.json();
        
        // Move each form to trash
        for (const form of workspaceForms) {
          await fetch(`/api/forms/${form.id}/trash`, {
            method: 'PATCH',
          });
        }
      }
      
      // Then delete the workspace
      const response = await fetch(`/api/workspace/${workspace.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      
      // Redirect to workspaces page with success message
      toast({
        title: 'Workspace deleted',
        description: `The workspace "${workspace.name}" has been deleted and its forms moved to trash.`,
        duration: 3000,
      });
      
      router.push('/dashboard/workspace');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workspace',
        variant: 'destructive',
        duration: 3000,
      });
      setIsDeleting(false);
    }
  };

  const handleDeleteForm = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    
    // Prevent multiple clicks
    if (formActionInProgress[formId]) return;
    
    setFormActionInProgress(prev => ({ ...prev, [formId]: true }));
    
    try {
      // Use the trash API endpoint to move the form to trash
      const response = await fetch(`/api/forms/${formId}/trash`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to move form to trash');
      }
      
      // Remove form from the local state
      setForms(forms.filter(form => form.id !== formId));
      setFilteredForms(filteredForms.filter(form => form.id !== formId));
      
      // Refresh global data to update sidebar and other components
      await forceRefresh();
      
      toast({
        title: 'Form moved to trash',
        description: 'The form has been moved to trash.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error moving form to trash:', error);
      toast({
        title: 'Error',
        description: 'Failed to move form to trash',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setFormActionInProgress(prev => ({ ...prev, [formId]: false }));
    }
  };

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
    <>
      <DashboardHeader 
        workspaceId={workspaceId}
        workspaceName={workspace.name}
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium">{workspace.name}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-60 hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleEditWorkspace}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteWorkspaceDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              New form
            </Button>
          </div>

          <hr className="border-t border-gray-200" />

          <div className="space-y-2">
            {filteredForms.length > 0 ? (
              filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-60 hover:opacity-100"
                        onClick={(e) => handleDeleteForm(e, form.id)}
                        disabled={formActionInProgress[form.id]}
                      >
                        {formActionInProgress[form.id] ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        )}
                      </Button>
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
      </div>

      <WorkspaceModal
        isOpen={isEditModalOpen}
        onOpenChange={(open) => setIsEditModalOpen(open)}
        workspaceToEdit={{
          id: workspace.id,
          name: workspace.name,
        }}
        onSuccess={refreshWorkspace}
      />
      
      {/* Delete Workspace Confirmation Dialog */}
      <Dialog open={showDeleteWorkspaceDialog} onOpenChange={setShowDeleteWorkspaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? All forms in this workspace will be moved to trash and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteWorkspaceDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workspace
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
