"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Settings, Trash2 } from 'lucide-react'
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
import { CreateWorkspaceButton, WorkspaceModal } from '@/components/workspace-modal'

interface WorkspaceItem {
  id: string
  name: string
  emoji?: string
  formCount?: number
  createdAt: Date
  updatedAt: Date
}

export default function WorkspacePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workspaceToEdit, setWorkspaceToEdit] = useState<WorkspaceItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !user) return

      try {
        const response = await fetch('/api/user')
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const userData = await response.json()
        
        // Fetch workspaces using API
        const workspacesResponse = await fetch(`/api/workspace?userId=${userData.id}`)
        if (!workspacesResponse.ok) {
          throw new Error('Failed to fetch workspaces')
        }
        
        const workspacesData = await workspacesResponse.json()
        
        // Get form counts for each workspace
        const workspacesWithFormCounts = await Promise.all(
          workspacesData.map(async (workspace: any) => {
            const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms?userId=${userData.id}`)
            if (!formsResponse.ok) {
              return {
                ...workspace,
                formCount: 0
              }
            }
            
            const forms = await formsResponse.json()
            return {
              ...workspace,
              formCount: forms.length
            }
          })
        )
        
        setWorkspaces(workspacesWithFormCounts)
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [user, isLoaded])

  const handleEditWorkspace = (workspace: WorkspaceItem) => {
    setWorkspaceToEdit(workspace)
    setIsEditModalOpen(true)
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspace/${workspaceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete workspace')
      }
      
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId))
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  const refreshWorkspaces = async () => {
    if (!isLoaded || !user) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user')
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const userData = await response.json()
      
      // Fetch workspaces using API
      const workspacesResponse = await fetch(`/api/workspace?userId=${userData.id}`)
      if (!workspacesResponse.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      
      const workspacesData = await workspacesResponse.json()
      
      // Get form counts for each workspace
      const workspacesWithFormCounts = await Promise.all(
        workspacesData.map(async (workspace: any) => {
          const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms?userId=${userData.id}`)
          if (!formsResponse.ok) {
            return {
              ...workspace,
              formCount: 0
            }
          }
          
          const forms = await formsResponse.json()
          return {
            ...workspace,
            formCount: forms.length
          }
        })
      )
      
      setWorkspaces(workspacesWithFormCounts)
    } catch (error) {
      console.error('Error refreshing workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-medium">Workspaces</h1>
        <div className="flex items-center gap-4">
          <CreateWorkspaceButton onSuccess={refreshWorkspaces} />
        </div>
      </div>

      {isLoading ? (
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
      ) : workspaces.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-6">Create workspaces to organize your forms.</p>
          <CreateWorkspaceButton onSuccess={refreshWorkspaces} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id} 
              className="border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/workspace/${workspace.id}`)}
            >
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{workspace.emoji || '📁'}</span>
                  <div>
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    <CardDescription>
                      Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleEditWorkspace(workspace)
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWorkspace(workspace.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workspace.formCount === 0 
                    ? 'No forms' 
                    : workspace.formCount === 1 
                      ? '1 form' 
                      : `${workspace.formCount} forms`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Workspace Modal */}
      <WorkspaceModal
        isOpen={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (!open) {
            setWorkspaceToEdit(null)
          }
        }}
        workspaceToEdit={workspaceToEdit || undefined}
        onSuccess={refreshWorkspaces}
      />
    </div>
  )
} 