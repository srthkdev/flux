"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface FormData {
  id: string
  title: string
  fields: FormField[]
}

interface FormField {
  id: string
  type: string
  label: string
}

interface FormResponse {
  id: string
  formId: string
  data: Record<string, any>
  createdAt: string
}

export default function FormResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form details
        const formResponse = await fetch(`/api/forms/${formId}`)
        if (!formResponse.ok) {
          throw new Error('Failed to fetch form')
        }
        
        const formData = await formResponse.json()
        setForm(formData)
        
        // Fetch form responses
        const responsesResponse = await fetch(`/api/forms/${formId}/responses`)
        if (!responsesResponse.ok) {
          throw new Error('Failed to fetch responses')
        }
        
        const responsesData = await responsesResponse.json()
        setResponses(responsesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [formId])
  
  const handleDownloadCSV = () => {
    if (!form || !responses.length) return
    
    // Create CSV header row
    const headers = ['Submission Date', ...form.fields.map(field => field.label)]
    
    // Create CSV rows for each response
    const rows = responses.map(response => {
      const date = new Date(response.createdAt).toLocaleString()
      const values = form.fields.map(field => {
        const value = response.data[field.id]
        
        // Handle different types of values
        if (value === undefined || value === null) return ''
        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
        return String(value)
      })
      
      return [date, ...values]
    })
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${form.title}-responses.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const formatResponseValue = (field: FormField, value: any) => {
    if (value === undefined || value === null) return '-'
    
    if (field.type === 'checkbox') {
      return value ? 'Yes' : 'No'
    }
    
    return String(value)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!form) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Form not found</h1>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{form.title} - Responses</h1>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {responses.length} {responses.length === 1 ? 'response' : 'responses'} received
        </p>
        
        {responses.length > 0 && (
          <Button onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        )}
      </div>
      
      {responses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No responses yet</h3>
          <p className="text-muted-foreground mb-6">Share your form to start collecting responses.</p>
          <Button 
            onClick={() => router.push(`/dashboard/forms/${formId}`)}
            variant="outline"
          >
            Back to Form
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Submission Date</TableHead>
                  {form.fields.map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      {new Date(response.createdAt).toLocaleString()}
                    </TableCell>
                    {form.fields.map((field) => (
                      <TableCell key={field.id}>
                        {formatResponseValue(field, response.data[field.id])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
} 