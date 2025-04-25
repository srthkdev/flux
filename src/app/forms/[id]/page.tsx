"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { prepareFieldsForUI } from '@/lib/form-helpers'

interface FormData {
  id: string
  title: string
  description?: string
  published: boolean
  banner?: string
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
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}?public=true`)
        if (!response.ok) {
          throw new Error('Form not found or not published')
        }
        
        const formData = await response.json()
        
        if (!formData.published) {
          throw new Error('This form is not currently accepting responses')
        }
        
        // Log banner data for debugging
        console.log('Form data received:', { 
          banner: formData.banner,
          hasFields: Array.isArray(formData.fields),
          fieldCount: Array.isArray(formData.fields) ? formData.fields.length : 0
        });
        
        // Ensure field types are compatible with the UI
        if (formData.fields && Array.isArray(formData.fields)) {
          formData.fields = prepareFieldsForUI(formData.fields);
        }
        
        setForm(formData)
        
        // Initialize form values
        const initialValues: Record<string, any> = {}
        formData.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialValues[field.id] = false
          } else if (field.type === 'multiple_choice' || field.type === 'dropdown') {
            initialValues[field.id] = ''
          } else if (field.type === 'multi_select') {
            initialValues[field.id] = []
          } else {
            initialValues[field.id] = ''
          }
        })
        
        setFormValues(initialValues)
        
        // Set banner if available and not empty
        if (formData.banner) {
          console.log('Setting banner image:', formData.banner.substring(0, 50) + '...');
          setBannerImage(formData.banner);
        } else {
          console.log('No banner found in form data');
          setBannerImage(null);
        }
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
      if (field.required && field.type !== 'h1' && field.type !== 'h2' && field.type !== 'h3') {
        const value = formValues[field.id]
        
        if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = 'This field is required'
          isValid = false
        } else if (field.type === 'file' && (!value || !value.file)) {
          newErrors[field.id] = 'Please upload a file'
          isValid = false
        } else if (field.type === 'multi_select' && (!value || value.length === 0)) {
          newErrors[field.id] = 'Please select at least one option'
          isValid = false
        } else if (field.type !== 'checkbox' && field.type !== 'file' && field.type !== 'multi_select' && (!value || (typeof value === 'string' && value.trim() === ''))) {
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
      
      // URL validation
      if (field.type === 'link' && formValues[field.id]) {
        try {
          new URL(formValues[field.id])
        } catch (e) {
          newErrors[field.id] = 'Please enter a valid URL'
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
      
      console.log(`Submitting form data for formId: ${formId}`, submissionData)
      
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to submit form: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to submit form: ${response.status} ${response.statusText}`)
      }
      
      const responseData = await response.json()
      console.log('Form submission successful:', responseData)
      
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
  
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 py-8">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      ) : !form ? (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Form not found</h1>
          <p className="text-muted-foreground mb-6">This form may not exist or is no longer accepting responses.</p>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </div>
      ) : isSubmitted ? (
        <div className="text-center py-12 space-y-4">
          <div className="bg-green-50 text-green-700 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Form submitted successfully!</h1>
          <p className="text-muted-foreground">Thank you for your response.</p>
          <Button 
            onClick={() => router.push('/')}
            className="mt-4"
          >
            Go to Homepage
          </Button>
        </div>
      ) : (
        <>
          {/* Display banner if available */}
          {bannerImage && (
            <div className="mb-6">
              <img src={bannerImage} alt="Form banner" className="w-full h-48 object-cover rounded-lg" />
            </div>
          )}
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {form.fields.map((field) => (
              <div 
                key={field.id} 
                className="bg-white rounded-lg shadow-sm p-6"
              >
                {/* Heading fields */}
                {field.type === 'h1' && (
                  <h1 className="text-2xl font-bold">{field.label}</h1>
                )}
                
                {field.type === 'h2' && (
                  <h2 className="text-xl font-bold">{field.label}</h2>
                )}
                
                {field.type === 'h3' && (
                  <h3 className="text-lg font-bold">{field.label}</h3>
                )}
                
                {/* Regular input fields with labels */}
                {field.type !== 'h1' && field.type !== 'h2' && field.type !== 'h3' && (
                  <div className="space-y-3">
                    <Label 
                      htmlFor={field.id} 
                      className="text-base font-medium block"
                    >
                      {field.label} 
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.id}
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'long_answer' && (
                      <Textarea
                        id={field.id}
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                        className={`min-h-[100px] ${errors[field.id] ? 'border-red-500' : ''}`}
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <Input
                        id={field.id}
                        type="number"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'email' && (
                      <Input
                        id={field.id}
                        type="email"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "name@example.com"}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'phone' && (
                      <Input
                        id={field.id}
                        type="tel"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "+1 (555) 000-0000"}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <Input
                        id={field.id}
                        type="date"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'time' && (
                      <Input
                        id={field.id}
                        type="time"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'link' && (
                      <Input
                        id={field.id}
                        type="url"
                        value={formValues[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "https://example.com"}
                        className={errors[field.id] ? 'border-red-500' : ''}
                      />
                    )}
                    
                    {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                      <div className="space-y-2">
                        {field.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${i}`}
                              checked={formValues[field.id]?.[option] || false}
                              onCheckedChange={(checked) => {
                                handleInputChange(field.id, {
                                  ...formValues[field.id],
                                  [option]: checked
                                })
                              }}
                              className={errors[field.id] ? 'border-red-500' : ''}
                            />
                            <Label htmlFor={`${field.id}-${i}`} className="text-sm font-normal">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {field.type === 'multiple_choice' && field.options && field.options.length > 0 && (
                      <RadioGroup
                        value={formValues[field.id] || ''}
                        onValueChange={(value) => handleInputChange(field.id, value)}
                        className={errors[field.id] ? 'text-red-500' : ''}
                      >
                        <div className="space-y-2">
                          {field.options.map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                              <Label htmlFor={`${field.id}-${i}`} className="text-sm font-normal">{option}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                    
                    {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                      <Select
                        value={formValues[field.id] || ''}
                        onValueChange={(value) => handleInputChange(field.id, value)}
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
                    
                    {field.type === 'multi_select' && field.options && field.options.length > 0 && (
                      <div className="space-y-2">
                        {field.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${i}`}
                              checked={formValues[field.id]?.includes(option) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = [...(formValues[field.id] || [])]
                                if (checked) {
                                  if (!currentValues.includes(option)) {
                                    handleInputChange(field.id, [...currentValues, option])
                                  }
                                } else {
                                  handleInputChange(field.id, currentValues.filter(v => v !== option))
                                }
                              }}
                              className={errors[field.id] ? 'border-red-500' : ''}
                            />
                            <Label htmlFor={`${field.id}-${i}`} className="text-sm font-normal">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {field.type === 'file' && (
                      <div className="space-y-2">
                        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                          <input
                            id={field.id}
                            type="file"
                            className={`w-full ${errors[field.id] ? 'text-red-500' : ''}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleInputChange(field.id, { file })
                              }
                            }}
                            accept={field.fileTypes?.join(',') || '*/*'}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Max size: {field.fileSize || 5}MB
                          </p>
                        </div>
                        
                        {formValues[field.id]?.file && (
                          <div className="text-sm mt-1">
                            Selected file: {formValues[field.id].file.name}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {errors[field.id] && (
                      <p className="text-sm text-red-500">
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {errors._form && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors._form}
              </div>
            )}
            
            <div className="mt-8 flex items-start justify-start pb-10">
              <InteractiveHoverButton
                type="submit"
                disabled={isSubmitting}
                className="w-start flex items-start justify-start border-black bg-black px-6 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-5" />
                    Submit
                  </span>
                )}
              </InteractiveHoverButton>
            </div>
          </form>
        </>
      )}
    </div>
  )
}