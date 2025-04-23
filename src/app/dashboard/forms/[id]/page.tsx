"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Settings, ChevronDown, Trash, Upload, Hash, Plus } from "lucide-react"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FormShareModal } from "@/components/forms/form-share-modal"
import { DashboardHeader } from "@/components/dashboard-header"

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
}

interface FormField {
  id: string
  type:
    | "text"
    | "number"
    | "email"
    | "phone"
    | "date"
    | "checkbox"
    | "multiple_choice"
    | "dropdown"
    | "file"
    | "long_answer"
    | "multi_select"
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
  const commandInputRef = useRef<HTMLInputElement>(null)

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return
    setForm({
      ...form,
      title: e.target.value,
    })
  }

  const addField = (type: FormField["type"]) => {
    if (!form) return

    const newField: FormField = {
      id: `field_${Date.now()}`, // Generate a unique ID
      type,
      label: type === "file" ? "resume" : type === "email" ? "email" : type === "phone" ? "phone" : "skills",
      required: true,
      placeholder: "",
    }

    // Set appropriate defaults based on field type
    if (type === "checkbox" || type === "multiple_choice") {
      newField.options = []
    } else if (type === "dropdown") {
      newField.options = []
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

  const addOption = (fieldId: string, option = "") => {
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
    if (!form) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error("Failed to save form")
      }

      const updatedForm = await response.json()
      setForm(updatedForm)

      // Show success message
      console.log("Form saved successfully")
    } catch (error) {
      console.error("Error saving form:", error)
    } finally {
      setIsSaving(false)
    }
  }

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
          userId: await getUserId(),
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

  const getUserId = async () => {
    const response = await fetch("/api/user")
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    const userData = await response.json()
    return userData.id
  }

  const handleShareForm = () => {
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
        workspaceName={form.workspace?.name || "Personal Workspace"}
        formId={form.id}
        formName={form.title}
      />
      
      <div className="max-w-3xl mx-auto p-4 space-y-8">
        <div className="pt-4">
          <Input
            value={form.title}
            onChange={handleTitleChange}
            className="text-2xl font-medium border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Form title"
          />
        </div>

        <div className="space-y-8">
          {form.fields.map((field, index) => (
            <div
              key={field.id}
              className={`py-4 rounded-lg ${activeField === field.id ? "border-blue-400 shadow-sm" : ""}`}
              onClick={() => setActiveField(field.id)}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Question"
                      className="text-base font-normal border-0 p-0 focus-visible:ring-0"
                    />
                    {field.required && <span className="text-red-500 text-sm">*</span>}
                  </div>
                </div>
                {field.type === "dropdown" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-gray-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveField(field.id)
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
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

              <div className="mt-2">
                {field.type === "text" && (
                  <Input placeholder={field.placeholder || "Short answer text"} className="border-gray-200" />
                )}

                {field.type === "long_answer" && (
                  <textarea
                    placeholder={field.placeholder || "Long answer text"}
                    className="w-full p-2 rounded-md border border-gray-200 min-h-[100px]"
                  />
                )}

                {field.type === "number" && (
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={field.placeholder || "Number"}
                      className="border-gray-200 pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}

                {field.type === "phone" && (
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder={field.placeholder || "Phone number"}
                      className="border-gray-200 pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}

                {field.type === "email" && (
                  <Input
                    type="email"
                    placeholder={field.placeholder || "Email address"}
                    className="border-gray-200"
                  />
                )}

                {field.type === "dropdown" && (
                  <div className="relative">
                    <select className="w-full p-2 pr-8 rounded-md border border-gray-200 appearance-none">
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
                )}

                {field.type === "file" && (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to choose a file or drag here</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Size limit: {field.fileSize || 10} MB. For unlimited file uploads upgrade to Tally Pro.
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
                          <label htmlFor={`option-${field.id}-${i}`} className="text-sm">
                            {option}
                          </label>
                          {activeField === field.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeOption(field.id, i)
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
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
                          <label htmlFor={`option-${field.id}-${i}`} className="text-sm">
                            {option}
                          </label>
                          {activeField === field.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeOption(field.id, i)
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
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
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-6 flex items-center">
          <div className="flex items-center gap-2 text-gray-400 w-full">
            <Trash className="h-4 w-4" />
            <Plus className="h-4 w-4" />
            <div className="grid grid-cols-3 gap-1 text-gray-400">
              <div className="w-4 h-4 flex items-center justify-center">≡</div>
            </div>
            <Popover open={showCommandMenu} onOpenChange={setShowCommandMenu}>
              <PopoverTrigger asChild>
                <Input
                  ref={commandInputRef}
                  placeholder="Type a question"
                  className="border-0 focus-visible:ring-0 text-base"
                  value={commandInput}
                  onChange={handleCommandInputChange}
                />
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-64"
                align="start"
                hidden={!showCommandMenu || !commandInput.startsWith("/")}
              >
                <div className="py-2">
                  <div className="text-xs font-medium text-gray-500 px-3 py-1">Questions</div>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("text")}
                  >
                    <span className="mr-2">—</span> Short answer
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("long_answer")}
                  >
                    <span className="mr-2">≡</span> Long answer
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("multiple_choice")}
                  >
                    <span className="mr-2">○</span> Multiple choice
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("checkbox")}
                  >
                    <span className="mr-2">☑</span> Checkboxes
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("dropdown")}
                  >
                    <span className="mr-2">▼</span> Dropdown
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("number")}
                  >
                    <span className="mr-2">#</span> Number
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("email")}
                  >
                    <span className="mr-2">@</span> Email
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("phone")}
                  >
                    <span className="mr-2">☎</span> Phone number
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => handleCommandSelect("file")}
                  >
                    <span className="mr-2">📎</span> File upload
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-red-500 text-sm">*</span>
          </div>
        </div>

        <div className="mt-8">
          <Button className="bg-black hover:bg-gray-800 text-white px-6">
            Submit <span className="ml-1">→</span>
          </Button>
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
