"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { 
  MoreHorizontal, 
  Share, 
  Edit, 
  Trash, 
  FileText,
  Loader2,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { FormattedDate } from "@/components/ui/formatted-date"
import { DashboardHeader } from "@/components/dashboard-header"
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
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()

  const [form, setForm] = useState<FormData | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [submissionTitle, setSubmissionTitle] = useState("Most Recent Responses")
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  
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

  // Handle share dialog from query param
  useEffect(() => {
    if (searchParams?.get("share") === "true") {
      setShareDialogOpen(true)
    }
  }, [searchParams])

  const handleShareForm = () => {
    setShareDialogOpen(true)
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
      return <span className="text-muted-foreground">-</span>
    }
    
    // Handle objects (like files)
    if (typeof value === 'object' && value !== null) {
      if (fieldType === 'file' && value.fileName) {
        return (
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                // Open file in new tab if it's viewable, otherwise download
                const isPdf = value.fileType === 'application/pdf' || value.extension === 'pdf';
                const isImage = value.fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(value.extension);
                
                if (value.content && (isPdf || isImage)) {
                  const dataUrl = `data:${value.fileType};base64,${value.content}`;
                  window.open(dataUrl, '_blank');
                } else if (value.content) {
                  const link = document.createElement('a');
                  link.href = `data:${value.fileType};base64,${value.content}`;
                  link.download = value.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="text-sm text-blue-600 hover:underline truncate max-w-[150px] inline-block"
            >
              {value.fileName}
            </a>
          </div>
        );
      }
      
      // Handle multi-select
      if ((fieldType === 'multi_select' || fieldType === 'multiSelect') && Array.isArray(value)) {
        if (value.length === 0) return <span className="text-muted-foreground">-</span>;
        if (value.length === 1) return value[0];
        return (
          <span className="text-sm">
            {value[0]} <span className="text-xs text-muted-foreground">+{value.length - 1} more</span>
          </span>
        );
      }
      
      // For checkbox data stored as object with boolean values
      if (fieldType === 'checkbox' && !Array.isArray(value)) {
        const selected = Object.entries(value)
          .filter(([_, selected]) => selected === true)
          .map(([option]) => option);
        
        if (selected.length === 0) return <span className="text-muted-foreground">-</span>;
        if (selected.length === 1) return selected[0];
        return (
          <span className="text-sm">
            {selected[0]} <span className="text-xs text-muted-foreground">+{selected.length - 1} more</span>
          </span>
        );
      }
      
      // If it's some other object type, stringify it
      try {
        const str = JSON.stringify(value);
        return <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block">
          {str.length > 25 ? str.substring(0, 25) + '...' : str}
        </span>;
      } catch (e) {
        return <span className="text-sm text-muted-foreground">[Complex Data]</span>;
      }
    }
    
    // Handle simple types
    if (fieldType === 'checkbox') {
      return value ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground">-</span>;
    }
    
    // Handle dates
    if (fieldType === 'date' && value) {
      try {
        return <FormattedDate date={value} format="short" />;
      } catch (e) {
        return String(value);
      }
    }
    
    // Truncate long text
    if ((fieldType === 'text' || fieldType === 'long_answer') && typeof value === 'string' && value.length > 30) {
      return <span className="truncate max-w-[150px] inline-block" title={value}>
        {value.substring(0, 30)}...
      </span>;
    }
    
    return String(value);
  };

  const copyLink = () => {
    if (typeof window !== "undefined") {
      const link = window.location.origin + "/forms/" + form?.id;
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setCopying(false);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share this link with others"
        });
      }).catch((e) => {
        console.error("Failed to copy link: ", e);
        toast({
          title: "Failed to copy link",
          description: "There was an error copying the link"
        });
      });
    }
  }

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
                <div className="relative w-full overflow-auto max-h-[500px]">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b sticky top-0 bg-white">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Submitted</th>
                        {form.fields.filter(field => 
                          !['h1', 'h2', 'h3'].includes(field.type)
                        ).slice(0, 5).map(field => (
                          <th key={field.id} className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                            <div className="truncate w-32">{field.label}</div>
                          </th>
                        ))}
                        <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {submissions.map((submission) => (
                        <tr 
                          key={submission.id} 
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                          onClick={() => router.push(`/dashboard/forms/${formId}/responses/${submission.id}`)}
                        >
                          <td className="p-2 align-middle whitespace-nowrap">
                            <FormattedDate date={submission.createdAt} format="short" />
                          </td>
                          {form.fields.filter(field => 
                            !['h1', 'h2', 'h3'].includes(field.type)
                          ).slice(0, 5).map(field => (
                            <td key={field.id} className="p-2 align-middle w-32">
                              <div className="max-w-[150px] truncate">
                                {renderSubmissionValue(submission.data[field.id], field.type)}
                              </div>
                            </td>
                          ))}
                          <td className="p-2 align-middle text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                router.push(`/dashboard/forms/${formId}/responses/${submission.id}`);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {submissions.length > 5 && (
                    <div className="flex justify-end p-2 bg-white border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/forms/${formId}/responses`)}
                      >
                        View all responses
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No responses yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Share your form to start collecting responses. They will appear here once people start responding.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleShareForm}
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Share your form
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
        
        </Tabs>
      </div>
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your form</DialogTitle>
            <DialogDescription>
              {form?.published ? (
                "Your form is published and ready to be shared with others."
              ) : (
                <span className="text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Your form is not published. Publish it first to share.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {form?.published && (
            <>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue={`${
                      typeof window !== "undefined"
                        ? window.location.origin
                        : ""
                    }/forms/${form.id}`}
                    readOnly
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="px-3"
                  onClick={copyLink}
                >
                  <span className="sr-only">Copy</span>
                  {copying ? (
                    <Skeleton className="h-4 w-4" />
                  ) : copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-0.5">
                    <Label htmlFor="require-login">Require sign in</Label>
                    <p className="text-xs text-muted-foreground">
                      Only allow logged in users to submit your form
                    </p>
                  </div>
                  <Switch disabled id="require-login" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-0.5">
                    <Label htmlFor="limit-responses">Limit responses</Label>
                    <p className="text-xs text-muted-foreground">
                      Set a maximum number of allowed responses
                    </p>
                  </div>
                  <Switch disabled id="limit-responses" />
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="px-3"
                  variant="ghost"
                  onClick={() => toast({
                    title: "Coming soon",
                    description: "Additional sharing options will be available soon."
                  })}
                >
                  <Link
                    href={`/forms/${form.id}`}
                    target="_blank"
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" /> Preview Form
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 