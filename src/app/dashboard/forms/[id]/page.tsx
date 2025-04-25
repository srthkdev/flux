"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Settings, ChevronDown, Trash, Upload, Hash, Plus, Loader2, Check, Share, Pen, Eye, LayoutDashboard, Save } from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FormShareModal } from "@/components/forms/form-share-modal"
import { DashboardHeader } from "@/components/dashboard-header"
import { toast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button"

// Import form helpers
import { prepareFieldsForAPI, prepareFieldsForUI } from "@/lib/form-helpers"

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
  type:
    | "text"
    | "number"
    | "email"
    | "phone"
    | "date"
    | "time"
    | "checkbox"
    | "multiple_choice"
    | "dropdown"
    | "file"
    | "long_answer"
    | "multi_select"
    | "link"
    | "h1"
    | "h2"
    | "h3"
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // For multiple choice, dropdown
  fileSize?: number // Max file size in MB (default 5MB)
  fileTypes?: string[] // Allowed file types
}

export default function FormEditorPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string
  const { user, isLoaded } = useUser()

  const [form, setForm] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showFieldMenu, setShowFieldMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [commandInput, setCommandInput] = useState("")
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const commandInputRef = useRef<HTMLInputElement>(null)
  const fieldMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return

      setIsLoading(true)

      try {
        const response = await fetch(`/api/forms/${formId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch form")
        }

        const formData = await response.json()
        
        // Convert field types from schema to UI
        if (formData.fields && Array.isArray(formData.fields)) {
          formData.fields = prepareFieldsForUI(formData.fields);
        }
        
        // If we don't have workspace data but we have a workspaceId, fetch the workspace
        if (formData.workspaceId && !formData.workspace) {
          try {
            const workspaceResponse = await fetch(`/api/workspace/${formData.workspaceId}`)
            if (workspaceResponse.ok) {
              const workspaceData = await workspaceResponse.json()
              formData.workspace = {
                id: workspaceData.id,
                name: workspaceData.name
              }
            }
          } catch (error) {
            console.error("Error fetching workspace details:", error)
          }
        }
        
        setForm(formData)
        
        // Set banner if available
        if (formData.banner) {
          setBannerImage(formData.banner)
        }
      } catch (error) {
        console.error("Error fetching form:", error)

        // Fallback to a default form if the API fails
        setForm({
          id: formId,
          title: "Form title",
          description: "",
          fields: [],
          updatedAt: new Date(),
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [formId])
  
  // Close field menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldMenuRef.current && !fieldMenuRef.current.contains(event.target as Node)) {
        setShowFieldMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return
    setForm({
      ...form,
      title: e.target.value,
    })
  }
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!form) return
    setForm({
      ...form,
      description: e.target.value,
    })
  }

  const addField = (type: FormField["type"]) => {
    if (!form) return

    const newField: FormField = {
      id: `field_${Date.now()}`, // Generate a unique ID
      type,
      label: type === "file" ? "Upload File" : "Question",
      required: true,
      placeholder: "",
    }

    // Set appropriate defaults based on field type
    if (type === "checkbox" || type === "multiple_choice") {
      newField.options = ["Option 1"]
    } else if (type === "dropdown" || type === "multi_select") {
      newField.options = ["Option 1"]
    } else if (type === "file") {
      newField.fileSize = 10 // Default 10MB
      newField.fileTypes = ["application/pdf"] // Default allow PDFs
    }

    setForm({
      ...form,
      fields: [...form.fields, newField],
    })

    setShowFieldMenu(false)
    setCommandInput("")
    setShowCommandMenu(false)
  }

  const removeField = (fieldId: string) => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.filter((field) => field.id !== fieldId),
    })
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    })
  }

  const addOption = (fieldId: string, option = "New option") => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.map((field) => {
        if (field.id === fieldId && field.options) {
          return {
            ...field,
            options: [...field.options, option],
          }
        }
        return field
      }),
    })
  }

  const updateOption = (fieldId: string, index: number, value: string) => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          newOptions[index] = value
          return {
            ...field,
            options: newOptions,
          }
        }
        return field
      }),
    })
  }

  const removeOption = (fieldId: string, index: number) => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          newOptions.splice(index, 1)
          return {
            ...field,
            options: newOptions,
          }
        }
        return field
      }),
    })
  }

  const saveForm = async () => {
    if (!form) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Create a clean object to send to the API
      const { 
        title, 
        description, 
        fields, 
        published, 
        workspaceId, 
        banner 
      } = form;

      // Validate required fields
      if (!title) {
        throw new Error("Form title is required");
      }

      // Map field types to match schema
      const mappedFields = prepareFieldsForAPI(fields);

      // API payload - only send what's needed
      const payload = {
        title,
        description: description || "",
        published: published !== undefined ? published : false,
        workspaceId: workspaceId || null, // Explicitly set to null if not present
        banner,
        fields: mappedFields, // Use fields instead of schema
      };

      console.log("Saving form with payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error("Server error details:", errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
        }
        
        throw new Error(errorMessage);
      }

      const updatedForm = await response.json();
      console.log("Form saved successfully:", updatedForm);
      setForm(updatedForm);

      // Show success toast
      toast({
        title: "Form saved",
        description: "Your form has been saved successfully",
        duration: 2000,
      });

      // Show success state briefly
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving form:", error);
      
      // Show error toast
      toast({
        title: "Failed to save form",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishChange = async (published: boolean) => {
    if (!form) return;

    setIsPublishing(true);

    try {
      // Create a clean object to send to the API
      const { 
        title, 
        description, 
        fields, 
        workspaceId, 
        banner 
      } = form;

      // Validate required fields
      if (!title) {
        throw new Error("Form title is required");
      }

      // Map field types to match schema
      const mappedFields = prepareFieldsForAPI(fields);

      const payload = {
        title,
        description: description || "",
        published,
        workspaceId: workspaceId || null, // Explicitly set to null if not present
        banner,
        fields: mappedFields, // Use fields instead of schema
      };

      console.log("Publishing form with payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error("Server error details:", errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
        }
        
        throw new Error(errorMessage);
      }

      const updatedForm = await response.json();
      console.log("Form publish status updated:", updatedForm);
      setForm(updatedForm);

      toast({
        title: published ? "Form published" : "Form unpublished",
        description: published 
          ? "Your form is now available for submissions" 
          : "Your form is now in draft mode",
        duration: 2000,
      });

      return Promise.resolve();
    } catch (error) {
      console.error("Error updating form publish status:", error);
      
      toast({
        title: "Failed to update publish status",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 3000,
      });
      
      return Promise.reject(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const getUserId = () => {
    if (!user || !isLoaded) {
      return null
    }
    return user.id
  }

  const handleShareForm = () => {
    if (!form) return;
    setShowShareModal(true)
  }

  const handleCommandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCommandInput(value)

    if (value.startsWith("/")) {
      setShowCommandMenu(true)
    } else {
      setShowCommandMenu(false)
    }
  }

  const handleCommandSelect = (type: FormField["type"]) => {
    addField(type)
    if (commandInputRef.current) {
      commandInputRef.current.value = ""
    }
  }
  
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setBannerImage(event.target.result as string)
          
          // Update form with banner
          if (form) {
            setForm({
              ...form,
              banner: event.target.result as string
            })
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleViewDashboard = () => {
    router.push(`/dashboard/forms/${formId}/dashboard`)
    toast({
      title: "Navigating to dashboard",
      duration: 1500,
    })
  }

  if (isLoading || !form) {
    return (
      <div className="p-4">
        <div className="h-8 bg-muted/20 rounded animate-pulse w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
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
          { label: "Editor", href: `/dashboard/forms/${form.id}` }
        ]}
      />
      
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Top actions bar */}
        <div className="flex justify-between items-center mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {form.published && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewDashboard}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            
            <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md">
              <Switch 
                checked={form.published || false}
                onCheckedChange={(checked) => handlePublishChange(checked)}
                disabled={isPublishing}
              />
              <span className="text-sm ml-1">
                {isPublishing ? "Updating..." : form.published ? "Published" : "Draft"}
              </span>
            </div>

            {form.published && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShareForm}
              >
                <Share className="h-4 w-4" />
                
              </Button>
            )}
          </div>
        </div>

        {/* Banner area */}
        {bannerImage ? (
          <div className="mb-6 relative">
            <img src={bannerImage} alt="Form banner" className="w-full h-48 object-cover rounded-lg" />
            <button 
              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-sm"
              onClick={() => setBannerImage(null)}
            >
              <Trash className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="banner-upload"
              className="hidden"
              accept="image/*"
              onChange={handleBannerUpload}
            />
            <label htmlFor="banner-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Add banner or logo</p>
              </div>
            </label>
          </div>
        )}

        {/* Form title area - with larger inputs */}
        <div className="mb-8">
          <Input
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Form title" 
            className="w-full text-4xl md:text-5xl font-extrabold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 mb-4 h-auto py-3"
            style={{ fontSize: '3rem', lineHeight: '1.2' }}
          />
          <Textarea 
            value={form.description || ''}
            onChange={handleDescriptionChange}
            placeholder="Form description"
            className="w-full border-none resize-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-500 text-lg min-h-[80px]"
          />
        </div>

        <div className="space-y-8">
          {form.fields.map((field, index) => (
            <div
              key={field.id}
              className={`border rounded-lg p-6 ${activeField === field.id ? "border-blue-400 shadow-sm" : "border-gray-200"}`}
              onClick={() => setActiveField(field.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Type a question"
                    className="text-base font-medium border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                <div className="flex items-center">
                  {activeField === field.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      className="text-gray-400 hover:text-red-500 h-6 w-6"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                {field.type === "text" && (
                  <Input placeholder={field.placeholder || "Short answer text"} className="border-gray-200 bg-gray-50" />
                )}

                {field.type === "long_answer" && (
                  <textarea
                    placeholder={field.placeholder || "Long answer text"}
                    className="w-full p-2 rounded-md border border-gray-200 min-h-[100px] bg-gray-50"
                  />
                )}

                {field.type === "number" && (
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={field.placeholder || "Number"}
                      className="border-gray-200 pr-8 bg-gray-50"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}

                {field.type === "phone" && (
                  <Input
                    type="tel"
                    placeholder={field.placeholder || "Phone number"}
                    className="border-gray-200 bg-gray-50"
                  />
                )}

                {field.type === "email" && (
                  <Input
                    type="email"
                    placeholder={field.placeholder || "Email address"}
                    className="border-gray-200 bg-gray-50"
                  />
                )}
                
                {field.type === "date" && (
                  <Input
                    type="date"
                    placeholder={field.placeholder || "Date"}
                    className="border-gray-200 bg-gray-50"
                  />
                )}
                
                {field.type === "time" && (
                  <Input
                    type="time"
                    placeholder={field.placeholder || "Time"}
                    className="border-gray-200 bg-gray-50"
                  />
                )}

                {field.type === "dropdown" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <select className="w-full p-2 pr-8 rounded-md border border-gray-200 appearance-none bg-gray-50">
                        {field.options && field.options.length > 0 ? (
                          field.options.map((option, i) => (
                            <option key={i} value={option}>
                              {option}
                            </option>
                          ))
                        ) : (
                          <option disabled>Select an option</option>
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
                    </div>
                    
                    {activeField === field.id && field.options && (
                      <div className="space-y-2 mt-2">
                        {field.options.map((option, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(field.id, i, e.target.value)}
                              className="text-sm h-8 py-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOption(field.id, i);
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 mt-2"
                          onClick={() => addOption(field.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add option
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {field.type === "file" && (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50">
                    <div className="flex flex-col items-center">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Size limit: {field.fileSize || 10} MB
                      </p>
                    </div>
                  </div>
                )}

                {field.type === "checkbox" && (
                  <div className="space-y-2">
                    {field.options && field.options.length > 0 ? (
                      field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="checkbox" id={`option-${field.id}-${i}`} className="mr-2" />
                          {activeField === field.id ? (
                            <div className="flex items-center flex-1 gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(field.id, i, e.target.value)}
                                className="text-sm h-8 py-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeOption(field.id, i)
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <label htmlFor={`option-${field.id}-${i}`} className="text-sm">
                              {option}
                            </label>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No options added yet</div>
                    )}
                    {activeField === field.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 mt-2"
                        onClick={() => addOption(field.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add option
                      </Button>
                    )}
                  </div>
                )}

                {field.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {field.options && field.options.length > 0 ? (
                      field.options.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="radio" id={`option-${field.id}-${i}`} name={field.id} className="mr-2" />
                          {activeField === field.id ? (
                            <div className="flex items-center flex-1 gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(field.id, i, e.target.value)}
                                className="text-sm h-8 py-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeOption(field.id, i)
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <label htmlFor={`option-${field.id}-${i}`} className="text-sm">
                              {option}
                            </label>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No options added yet</div>
                    )}
                    {activeField === field.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 mt-2"
                        onClick={() => addOption(field.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add option
                      </Button>
                    )}
                  </div>
                )}
                
                {field.type === "multi_select" && (
                  <div className="space-y-4">
                    <div className="border rounded-md p-2 bg-gray-50">
                      <div className="text-sm text-gray-500">Select multiple options</div>
                    </div>
                    
                    {activeField === field.id && field.options && (
                      <div className="space-y-2 mt-2">
                        {field.options.map((option, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(field.id, i, e.target.value)}
                              className="text-sm h-8 py-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOption(field.id, i);
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 mt-2"
                          onClick={() => addOption(field.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add option
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-6" ref={fieldMenuRef}>
          <div className="flex items-center border border-gray-200 rounded-md p-2 text-gray-500">
            <button
              type="button"
              className="flex items-center w-full text-left"
              onClick={() => setShowFieldMenu(!showFieldMenu)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add question</span>
            </button>
          </div>
          
          {showFieldMenu && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                <div className="text-xs font-medium text-gray-500 px-3 py-1">Questions</div>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("text")}
                >
                  <span className="mr-2">—</span> Short answer
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("long_answer")}
                >
                  <span className="mr-2">≡</span> Long answer
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("multiple_choice")}
                >
                  <span className="mr-2">○</span> Multiple choice
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("checkbox")}
                >
                  <span className="mr-2">☑</span> Checkboxes
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("dropdown")}
                >
                  <span className="mr-2">▼</span> Dropdown
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("multi_select")}
                >
                  <span className="mr-2">☑☑</span> Multi-select
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("file")}
                >
                  <span className="mr-2">F</span> File upload
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("phone")}
                >
                  <span className="mr-2">P</span> Phone number
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("email")}
                >
                  <span className="mr-2">@</span> Email
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("link")}
                >
                  <span className="mr-2">L</span> Link
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("number")}
                >
                  <span className="mr-2">#</span> Number
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("date")}
                >
                  <span className="mr-2">D</span> Date
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("time")}
                >
                  <span className="mr-2">T</span> Time
                </button>
                <div className="text-xs font-medium text-gray-500 px-3 py-1 mt-1">Layout</div>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("h1")}
                >
                  <span className="mr-2">H1</span> Heading 1
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("h2")}
                >
                  <span className="mr-2">H2</span> Heading 2
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => addField("h3")}
                >
                  <span className="mr-2">H3</span> Heading 3
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-start justify-start pb-10">
          <InteractiveHoverButton 
            onClick={saveForm}
            disabled={isSaving}
            className={`
              px-6 py-2 text-base flex items-center 
              ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
              ${saveSuccess ? 'bg-green-50 border-green-200 text-green-600' : 'border-black bg-black text-white hover:bg-gray-800'}
            `}
          >
            {isSaving ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </span>
            )}
          </InteractiveHoverButton>
        </div>
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
