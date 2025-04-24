"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  MoreHorizontal, 
  Share, 
  Edit, 
  Trash, 
  FileText,
  Loader2,
  Download,
  Settings
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { FormShareModal } from "@/components/forms/form-share-modal"
import { useData } from "@/contexts/DataContext"

interface FormSubmission {
  id: string
  formId: string
  createdAt: Date
  data: Record<string, any>
}

interface FormData {
  id: string
  title: string
  description?: string
  workspaceId?: string
  workspace?: {
    id: string
    name: string
  }
  fields: FormField[]
  updatedAt: Date
  published?: boolean
  banner?: string
}

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
  fileSize?: number
  fileTypes?: string[]
}

export default function FormDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string
  const { forceRefresh } = useData()

  const [form, setForm] = useState<FormData | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  
  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) return

      setIsLoading(true)

      try {
        // Fetch form details
        const formResponse = await fetch(`/api/forms/${formId}`)
        if (!formResponse.ok) {
          throw new Error("Failed to fetch form")
        }
        const formData = await formResponse.json()
        setForm(formData)
        
        // Fetch form submissions with more detailed error handling
        console.log(`Fetching responses for form: ${formId}`)
        
        const responsesResponse = await fetch(`/api/forms/${formId}/responses`)
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json()
          console.log(`Successfully fetched ${responsesData.length} responses:`, responsesData)
          setSubmissions(responsesData)
        } else {
          const errorText = await responsesResponse.text()
          console.error(`Failed to fetch responses: ${responsesResponse.status} ${responsesResponse.statusText}`, errorText)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormData()
  }, [formId])

  const handleShareForm = () => {
    setShowShareModal(true)
  }

  const handleEditForm = () => {
    router.push(`/dashboard/forms/${formId}`)
  }

  const handleDeleteForm = async () => {
    if (!form) return;
    
    try {
      const response = await fetch(`/api/forms/${formId}/trash`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete form');
      }
      
      // Refresh data context to update all places showing forms
      await forceRefresh();
      
      // Navigate to workspace if available, otherwise go to dashboard
      if (form.workspaceId) {
        router.push(`/dashboard/workspace/${form.workspaceId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handlePublishChange = async (published: boolean) => {
    if (!form) return

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          published,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update form publish status")
      }

      const updatedForm = await response.json()
      setForm(updatedForm)

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating form publish status:", error)
      return Promise.reject(error)
    }
  }

  const renderSubmissionValue = (value: any, fieldType: string) => {
    if (value === undefined || value === null) {
      return "-";
    }
    
    if (typeof value === "object" && value !== null) {
      if (fieldType === "file" && value.fileName) {
        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[200px]">{value.fileName}</span>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <a href="#" onClick={(e) => {
                e.preventDefault();
                // Create a base64 download link
                if (value.content) {
                  const link = document.createElement('a');
                  link.href = `data:${value.fileType};base64,${value.content}`;
                  link.download = value.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        );
      } else if (fieldType === "checkbox" || fieldType === "multi_select") {
        // For checkbox with options or multi_select, show selected options
        if (Array.isArray(value)) {
          return value.join(", ");
        } else {
          // For checkbox data stored as object with boolean values
          return Object.entries(value)
            .filter(([_, selected]) => selected)
            .map(([option]) => option)
            .join(", ");
        }
      }
      // For any other object type, stringify it
      return JSON.stringify(value);
    }
    
    // Handle other field types
    switch (fieldType) {
      case "date":
        return new Date(value).toLocaleDateString();
      case "link":
        return (
          <a 
            href={value} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-[200px] inline-block"
          >
            {value}
          </a>
        );
      default:
        return String(value);
    }
  };

  if (isLoading || !form) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        workspaceId={form.workspaceId}
        workspaceName={form.workspace?.name || "My Workspace"}
        formId={form.id}
        formName={form.title}
        breadcrumbs={[
          { label: form.workspace?.name || "My Workspace", href: `/dashboard/workspace/${form.workspaceId || ''}` },
          { label: form.title, href: `/dashboard/forms/${form.id}` },
          { label: "Dashboard", href: `/dashboard/forms/${form.id}/dashboard` }
        ]}
      />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{form.title}</h1>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleShareForm} variant="outline">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditForm}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit form
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${formId}/settings`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleDeleteForm} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete form
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Form Summary</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total submissions</div>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Form fields</div>
                  <div className="text-2xl font-bold">{form.fields.length}</div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <div className="text-2xl font-bold">{form.published ? "Published" : "Draft"}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="submissions" className="space-y-4">
            <div className="rounded-lg border bg-card">
              {submissions.length > 0 ? (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Submitted at</th>
                        {form.fields.filter(field => 
                          !['h1', 'h2', 'h3'].includes(field.type)
                        ).map(field => (
                          <th key={field.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            {field.label}
                          </th>
                        ))}
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </td>
                          {form.fields.filter(field => 
                            !['h1', 'h2', 'h3'].includes(field.type)
                          ).map(field => (
                            <td key={field.id} className="p-4 align-middle">
                              {renderSubmissionValue(submission.data[field.id], field.type)}
                            </td>
                          ))}
                          <td className="p-4 align-middle">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/forms/${formId}/responses/${submission.id}`)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No responses yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Share your form to start collecting responses. They will appear here once people start responding.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Integrations</h2>
              <p className="text-muted-foreground">
                Connect your form to other services to automate your workflow.
                Integrations coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {showShareModal && (
        <FormShareModal
          isOpen={showShareModal}
          onOpenChange={setShowShareModal}
          formId={form.id}
          isPublished={form.published || false}
          onPublishChange={handlePublishChange}
        />
      )}
    </>
  )
} 