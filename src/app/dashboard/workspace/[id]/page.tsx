"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, MoreHorizontal, Settings, Trash2, ArrowLeft } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { workspaceService } from '@/lib/services/workspace-service'
import { WorkspaceModal } from '@/components/workspace-modal'

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
  emoji?: string
  createdAt: Date
  updatedAt: Date
}

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string
  const { user, isLoaded } = useUser()
  
  const [forms, setForms] = useState<FormItem[]>([])
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceId) return

      setIsLoading(true)
      
      try {
        const response = await fetch('/api/user')
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const userData = await response.json()
        
        // Fetch workspace details using API
        const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`)
        if (!workspaceResponse.ok) {
          throw new Error('Failed to fetch workspace details')
        }
        
        const currentWorkspace = await workspaceResponse.json()
        
        // Convert null emoji to undefined to match our type
        setWorkspace({
          id: currentWorkspace.id,
          name: currentWorkspace.name,
          emoji: currentWorkspace.emoji || undefined,
          createdAt: currentWorkspace.createdAt,
          updatedAt: currentWorkspace.updatedAt
        })
        
        // Fetch forms in this workspace using API
        const formsResponse = await fetch(`/api/workspace/${workspaceId}/forms?userId=${userData.id}`)
        if (!formsResponse.ok) {
          throw new Error('Failed to fetch workspace forms')
        }
        
        const workspaceForms = await formsResponse.json()
        setForms(workspaceForms || [])
      } catch (error) {
        console.error('Error fetching workspace data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [workspaceId, router])

  const handleCreateForm = async () => {
    if (!workspace) return
    
    try {
      const response = await fetch('/api/user')
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await response.json()
      
      const formResponse = await fetch(`/api/workspace/${workspace.id}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled',
          description: '',
          userId: userData.id,
        }),
      })
      
      if (!formResponse.ok) {
        throw new Error('Failed to create form')
      }
      
      const newForm = await formResponse.json()
      router.push(`/dashboard/forms/${newForm.id}`)
    } catch (error) {
      console.error('Error creating form:', error)
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
      const response = await fetch('/api/user')
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await response.json()
      
      // Fetch workspace details using API
      const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`)
      if (!workspaceResponse.ok) {
        throw new Error('Failed to fetch workspace details')
      }
      
      const currentWorkspace = await workspaceResponse.json()
      
      // Convert null emoji to undefined to match our type
      setWorkspace({
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        emoji: currentWorkspace.emoji || undefined,
        createdAt: currentWorkspace.createdAt,
        updatedAt: currentWorkspace.updatedAt
      })
      
      // Fetch forms in this workspace using API
      const formsResponse = await fetch(`/api/workspace/${workspaceId}/forms?userId=${userData.id}`)
      if (!formsResponse.ok) {
        throw new Error('Failed to fetch workspace forms')
      }
      
      const workspaceForms = await formsResponse.json()
      setForms(workspaceForms || [])
    } catch (error) {
      console.error('Error refreshing workspace data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !workspace) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => router.push('/dashboard/workspace')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="h-8 bg-muted/30 rounded animate-pulse w-1/4" />
        </div>
        
        <div className="border-b pb-6 mb-6">
          <div className="h-6 bg-muted/30 rounded animate-pulse w-32 mb-4" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted/30 rounded animate-pulse w-3/4 mb-2" />
                <div className="h-4 bg-muted/30 rounded animate-pulse w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted/30 rounded animate-pulse w-full mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => router.push('/dashboard/workspace')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center">
            <span className="text-2xl mr-2">{workspace.emoji || '📁'}</span>
            <h1 className="text-3xl font-serif font-medium">{workspace.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditWorkspace}>
            <Settings className="h-4 w-4 mr-2" />
            Edit workspace
          </Button>
          
          <Button onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            New form
          </Button>
        </div>
      </div>
      
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-medium">Forms</h2>
      </div>

      {forms.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No forms in this workspace</h3>
          <p className="text-muted-foreground mb-6">Create forms to collect responses and organize them in this workspace.</p>
          <Button onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card 
              key={form.id} 
              className="border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/forms/${form.id}`)}
            >
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <CardDescription>
                    Edited {new Date(form.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/forms/${form.id}/edit`);
                    }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/forms/${form.id}/responses`);
                    }}>
                      View responses
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch(`/api/forms/${form.id}/trash`, {
                          method: 'PATCH',
                        })
                          .then(response => {
                            if (!response.ok) {
                              throw new Error('Failed to move form to trash');
                            }
                            // Update local state
                            setForms(forms.filter(f => f.id !== form.id));
                          })
                          .catch(error => {
                            console.error('Error moving form to trash:', error);
                          });
                      }}
                    >
                      Move to trash
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {form.description || 'No description'}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <span className={`text-xs py-1 px-2 rounded-full ${form.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {form.published ? 'Published' : 'Draft'}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Workspace Modal */}
      <WorkspaceModal
        isOpen={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
        }}
        workspaceToEdit={workspace ? {
          id: workspace.id,
          name: workspace.name,
          emoji: workspace.emoji
        } : undefined}
        onSuccess={refreshWorkspace}
      />
    </div>
  )
} 