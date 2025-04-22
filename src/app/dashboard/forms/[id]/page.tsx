"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Settings, CirclePlus, Save, Share } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { workspaceService } from '@/lib/services/workspace-service'

interface FormData {
  id: string
  title: string
  description?: string
  workspaceId?: string
  fields: FormField[]
  updatedAt: Date
  published?: boolean
}

interface FormField {
  id: string
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'checkbox' | 'multiple_choice' | 'dropdown' | 'file' | 'long_answer'
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // For multiple choice, dropdown
  fileSize?: number  // Max file size in MB (default 5MB)
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
  
  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return
      
      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/forms/${formId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch form')
        }
        
        const formData = await response.json()
        setForm(formData)
      } catch (error) {
        console.error('Error fetching form:', error)
        
        // Fallback to a default form if the API fails
        setForm({
          id: formId,
          title: 'Form title',
          description: '',
          fields: [],
          updatedAt: new Date()
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
      title: e.target.value
    })
  }
  
  const addField = (type: FormField['type']) => {
    if (!form) return
    
    const newField: FormField = {
      id: `field_${Date.now()}`, // Generate a unique ID
      type,
      label: 'Untitled question',
      required: false,
      placeholder: '',
      options: type === 'multiple_choice' || type === 'dropdown' ? ['Option 1'] : undefined,
      fileSize: type === 'file' ? 5 : undefined, // Default 5MB
      fileTypes: type === 'file' ? ['image/*', 'application/pdf'] : undefined, // Default allow images and PDFs
    }
    
    setForm({
      ...form,
      fields: [...form.fields, newField]
    })
    
    setShowFieldMenu(false)
  }
  
  const removeField = (fieldId: string) => {
    if (!form) return
    
    setForm({
      ...form,
      fields: form.fields.filter(field => field.id !== fieldId)
    })
  }
  
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return
    
    setForm({
      ...form,
      fields: form.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    })
  }
  
  const saveForm = async () => {
    if (!form) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save form')
      }
      
      const updatedForm = await response.json()
      setForm(updatedForm)
      
      // Show success message
      console.log('Form saved successfully')
    } catch (error) {
      console.error('Error saving form:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleShareForm = () => {
    if (!form) return
    
    // First ensure the form is saved
    saveForm().then(() => {
      // Open a dialog to share the form
      const shareUrl = `${window.location.origin}/forms/${formId}`
      
      // Create temporary input element to copy URL
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      
      // Show success message
      toast({
        title: 'Link copied to clipboard',
        description: 'Share this link with others to collect responses.',
        duration: 3000,
      })
      
      // If form is not published, ask if they want to publish
      if (!form.published) {
        const shouldPublish = confirm('Form is not published. Publish now to allow submissions?')
        
        if (shouldPublish) {
          setForm({
            ...form,
            published: true
          })
          
          // Save the published state
          fetch(`/api/forms/${formId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...form,
              published: true
            }),
          }).then(response => {
            if (!response.ok) {
              throw new Error('Failed to publish form')
            }
            
            toast({
              title: 'Form published successfully',
              duration: 3000,
            })
          }).catch(error => {
            console.error('Error publishing form:', error)
            toast({
              title: 'Failed to publish form',
              description: 'Please try again later',
              variant: 'destructive',
            })
          })
        }
      }
    })
  }
  
  if (isLoading || !form) {
    return (
      <div className="flex flex-col h-screen">
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 bg-muted/30 rounded animate-pulse w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/forms/${formId}/settings`)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => handleShareForm()}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button disabled className="opacity-50">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-6 flex justify-center">
          <div className="w-full max-w-3xl animate-pulse space-y-6">
            <div className="h-12 bg-muted/30 rounded w-2/3 mx-auto" />
            <div className="h-24 bg-muted/30 rounded w-full" />
            <div className="h-24 bg-muted/30 rounded w-full" />
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-medium truncate">{form.title || 'Untitled Form'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/forms/${formId}/settings`)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => handleShareForm()}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={saveForm} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6 flex justify-center overflow-y-auto bg-slate-50">
        <div className="w-full max-w-3xl space-y-6">
          {/* Form title section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <Input
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Form title"
              className="text-xl font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 pb-2 mb-4"
            />
            <Input
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Form description"
              className="border-0 text-muted-foreground px-0 focus-visible:ring-0"
            />
          </div>
          
          {/* Form fields */}
          {form.fields.map((field, index) => (
            <div key={field.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Question"
                    className="text-lg font-medium border-0 rounded-none px-0 focus-visible:ring-0 pb-1"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {field.type === 'text' && 'Short answer'}
                    {field.type === 'number' && 'Number input'}
                    {field.type === 'email' && 'Email address'}
                    {field.type === 'phone' && 'Phone number'}
                    {field.type === 'date' && 'Date picker'}
                    {field.type === 'checkbox' && 'Checkboxes'}
                    {field.type === 'multiple_choice' && 'Multiple choice'}
                    {field.type === 'dropdown' && 'Dropdown select'}
                    {field.type === 'file' && 'File upload'}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeField(field.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Field preview based on type */}
              <div className="mt-4">
                {field.type === 'text' && (
                  <Input 
                    placeholder={field.placeholder || 'Short answer text'} 
                    disabled 
                    className="bg-muted/20"
                  />
                )}
                
                {field.type === 'number' && (
                  <Input 
                    type="number" 
                    placeholder={field.placeholder || 'Number'} 
                    disabled 
                    className="bg-muted/20"
                  />
                )}
                
                {field.type === 'email' && (
                  <Input 
                    type="email" 
                    placeholder={field.placeholder || 'Email address'} 
                    disabled 
                    className="bg-muted/20"
                  />
                )}
                
                {field.type === 'phone' && (
                  <Input 
                    type="tel" 
                    placeholder={field.placeholder || 'Phone number'} 
                    disabled 
                    className="bg-muted/20"
                  />
                )}
                
                {field.type === 'date' && (
                  <Input 
                    type="date" 
                    disabled 
                    className="bg-muted/20"
                  />
                )}
                
                {/* Other field types would be implemented here */}
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t">
                <div className="flex items-center">
                  <label className="text-sm flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="mr-2"
                    />
                    Required
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add new field button */}
          <div className="relative">
            <div className="flex justify-center">
              <DropdownMenu open={showFieldMenu} onOpenChange={setShowFieldMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <CirclePlus className="h-5 w-5 mr-2" />
                    Add question
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => addField('text')}>
                    Short answer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addField('long_answer')}>
                    Long answer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addField('multiple_choice')}>
                    Multiple choice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addField('checkbox')}>
                    Checkboxes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addField('dropdown')}>
                    Dropdown
                  </DropdownMenuItem>
                  <h3 className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Inputs</h3>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => addField('number')}
                  >
                    <span className="mr-2">#</span> Number
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => addField('email')}
                  >
                    <span className="mr-2">@</span> Email
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => addField('phone')}
                  >
                    <span className="mr-2">☎</span> Phone number
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                    onClick={() => addField('file')}
                  >
                    <span className="mr-2">📎</span> File upload
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 