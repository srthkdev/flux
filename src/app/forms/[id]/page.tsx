"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormData {
  id: string
  title: string
  description?: string
  published: boolean
  fields: FormField[]
}

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
  fileTypes?: string[]
  fileSize?: number
}

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<FormData | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`)
        if (!response.ok) {
          throw new Error('Form not found or not published')
        }
        
        const formData = await response.json()
        
        if (!formData.published) {
          throw new Error('This form is not currently accepting responses')
        }
        
        setForm(formData)
        
        // Initialize form values
        const initialValues: Record<string, any> = {}
        formData.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialValues[field.id] = false
          } else if (field.type === 'multiple_choice' || field.type === 'dropdown') {
            initialValues[field.id] = ''
          } else {
            initialValues[field.id] = ''
          }
        })
        
        setFormValues(initialValues)
      } catch (error) {
        console.error('Error fetching form:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchForm()
  }, [formId])
  
  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value
    })
    
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors({
        ...errors,
        [fieldId]: ''
      })
    }
  }
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true
    
    if (!form) return false
    
    form.fields.forEach(field => {
      if (field.required) {
        const value = formValues[field.id]
        
        if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = 'This field is required'
          isValid = false
        } else if (field.type === 'file' && (!value || !value.file)) {
          newErrors[field.id] = 'Please upload a file'
          isValid = false
        } else if (field.type !== 'checkbox' && field.type !== 'file' && (!value || value.trim() === '')) {
          newErrors[field.id] = 'This field is required'
          isValid = false
        }
      }
      
      // File size validation (if a file is uploaded)
      if (field.type === 'file' && formValues[field.id]?.file) {
        const file = formValues[field.id].file as File
        const maxSizeInBytes = (field.fileSize || 5) * 1024 * 1024 // Convert MB to bytes
        
        if (file.size > maxSizeInBytes) {
          newErrors[field.id] = `File size exceeds the maximum limit of ${field.fileSize || 5}MB`
          isValid = false
        }
        
        // File type validation
        if (field.fileTypes && field.fileTypes.length > 0) {
          const fileType = file.type
          const isValidType = field.fileTypes.some(type => {
            if (type.endsWith('/*')) {
              // Handle wildcards like 'image/*'
              const mainType = type.split('/')[0]
              return fileType.startsWith(mainType + '/')
            }
            return type === fileType
          })
          
          if (!isValidType) {
            newErrors[field.id] = 'Invalid file type'
            isValid = false
          }
        }
      }
      
      // Email validation
      if (field.type === 'email' && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formValues[field.id])) {
          newErrors[field.id] = 'Please enter a valid email address'
          isValid = false
        }
      }
      
      // Phone validation
      if (field.type === 'phone' && formValues[field.id]) {
        const phoneRegex = /^\+?[0-9]{10,15}$/
        if (!phoneRegex.test(formValues[field.id].replace(/\s+/g, ''))) {
          newErrors[field.id] = 'Please enter a valid phone number'
          isValid = false
        }
      }
    })
    
    setErrors(newErrors)
    return isValid
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Process the form data
      const formData = new FormData()
      
      // Prepare data for submission by handling file uploads
      const submissionData: Record<string, any> = {}
      
      for (const fieldId in formValues) {
        const value = formValues[fieldId]
        const field = form?.fields.find(f => f.id === fieldId)
        
        if (field?.type === 'file' && value?.file) {
          // For file uploads, we need to convert to base64 for the API
          const file = value.file as File
          const base64 = await fileToBase64(file)
          submissionData[fieldId] = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            content: base64,
          }
        } else {
          submissionData[fieldId] = value
        }
      }
      
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit form')
      }
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({
        _form: 'There was an error submitting the form. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove the data URL part
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This form may not exist or is not currently accepting responses.
          </p>
        </div>
      </div>
    )
  }
  
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-6 mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Response Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your submission. Your response has been recorded.
          </p>
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
          >
            Return to Home
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mb-4">{form.description}</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields.map((field) => (
            <div key={field.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <Label 
                  htmlFor={field.id} 
                  className="text-base font-medium"
                >
                  {field.label} 
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              
              {field.type === 'text' && (
                <Input
                  id={field.id}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'long_answer' && (
                <Textarea
                  id={field.id}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'number' && (
                <Input
                  id={field.id}
                  type="number"
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'email' && (
                <Input
                  id={field.id}
                  type="email"
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || 'email@example.com'}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'phone' && (
                <Input
                  id={field.id}
                  type="tel"
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || '+1 (555) 000-0000'}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={formValues[field.id] || false}
                    onCheckedChange={(checked: boolean) => 
                      handleInputChange(field.id, Boolean(checked))
                    }
                    className={errors[field.id] ? 'border-red-500' : ''}
                  />
                  <Label htmlFor={field.id} className="text-sm">
                    {field.placeholder || 'Yes'}
                  </Label>
                </div>
              )}
              
              {field.type === 'multiple_choice' && field.options && (
                <RadioGroup
                  value={formValues[field.id] || ''}
                  onValueChange={(value: string) => handleInputChange(field.id, value)}
                  className={errors[field.id] ? 'text-red-500' : ''}
                >
                  <div className="space-y-2">
                    {field.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                        <Label htmlFor={`${field.id}-${i}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
              
              {field.type === 'dropdown' && field.options && (
                <Select
                  value={formValues[field.id] || ''}
                  onValueChange={(value: string) => handleInputChange(field.id, value)}
                >
                  <SelectTrigger className={errors[field.id] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option, i) => (
                      <SelectItem key={i} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {field.type === 'file' && (
                <div className="space-y-2">
                  <input
                    id={field.id}
                    type="file"
                    className={`w-full p-2 border rounded-md ${errors[field.id] ? 'border-red-500' : 'border-gray-300'}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Store the file object for submission
                        handleInputChange(field.id, { file })
                        
                        // Show file name
                        const fileInput = e.target
                        if (fileInput && fileInput.parentElement) {
                          const fileNameElement = document.createElement('div')
                          fileNameElement.className = 'text-sm mt-1'
                          fileNameElement.textContent = file.name
                          
                          // Clear previous file name
                          const prevFileNames = fileInput.parentElement.querySelectorAll('.text-sm')
                          prevFileNames.forEach(el => el.remove())
                          
                          fileInput.parentElement.appendChild(fileNameElement)
                        }
                      }
                    }}
                    accept={field.fileTypes?.join(',') || '*/*'}
                  />
                  <p className="text-xs text-gray-500">
                    {field.fileSize ? `Maximum file size: ${field.fileSize}MB` : 'Maximum file size: 5MB'}
                  </p>
                </div>
              )}
              
              {errors[field.id] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors[field.id]}
                </p>
              )}
            </div>
          ))}
          
          {errors._form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors._form}
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 