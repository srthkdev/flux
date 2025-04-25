import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { formCreateSchema } from '@/schemas/form'

type FormCreateValues = z.infer<typeof formCreateSchema>

interface FormCreateModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: string
  onSuccess?: (formId: string) => void
}

export function FormCreateModal({
  isOpen,
  onOpenChange,
  workspaceId,
  onSuccess,
}: FormCreateModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<FormCreateValues>({
    resolver: zodResolver(formCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      workspaceId: workspaceId,
    },
  })

  const onSubmit = async (values: FormCreateValues) => {
    setIsCreating(true)
    
    try {
      const apiUrl = workspaceId 
        ? `/api/workspace/${workspaceId}/forms`
        : '/api/forms'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create form')
      }
      
      const data = await response.json()
      
      // Close modal and navigate to form editor
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push(`/dashboard/forms/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating form:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new form</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Form Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your form"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description to help participants understand the purpose of this form"
              {...form.register('description')}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Form'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 