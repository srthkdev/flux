"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Settings, Trash2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from '@/hooks/use-toast'

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
import { WorkspaceCard } from '@/components/workspace-card'
import { CreateWorkspaceButton } from '@/components/workspace-modal'

interface WorkspaceItem {
  id: string
  name: string
  formCount: number | undefined
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
        // Fetch workspaces using API - no need to pass userId as it's fetched from auth
        const workspacesResponse = await fetch(`/api/workspace`)
        if (!workspacesResponse.ok) {
          throw new Error('Failed to fetch workspaces')
        }
        
        const workspacesData = await workspacesResponse.json()
        
        // Get form counts for each workspace
        const workspacesWithFormCounts = await Promise.all(
          workspacesData.map(async (workspace: any) => {
            const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms`)
            if (!formsResponse.ok) {
              return {
                ...workspace,
                // Remove emoji completely, even if it exists in the database
                emoji: undefined,
                formCount: 0
              }
            }
            
            const forms = await formsResponse.json()
            return {
              ...workspace,
              // Remove emoji completely, even if it exists in the database
              emoji: undefined,
              formCount: forms.length
            }
          })
        )
        
        setWorkspaces(workspacesWithFormCounts)
      } catch (error) {
        console.error('Error fetching workspaces:', error)
        toast({
          title: 'Failed to load workspaces',
          description: 'Please refresh the page or try again later',
          variant: 'destructive'
        })
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
      const deleteResponse = await fetch(`/api/workspace/${workspaceId}`, {
        method: 'DELETE',
      })
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete workspace')
      }
      
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId))
      
      toast({
        title: 'Workspace deleted successfully',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error deleting workspace:', error)
      toast({
        title: 'Failed to delete workspace',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  const refreshWorkspaces = async () => {
    if (!isLoaded || !user) return
    
    setIsLoading(true)
    
    try {
      // Fetch workspaces using API
      const workspacesResponse = await fetch(`/api/workspace`)
      if (!workspacesResponse.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      
      const workspacesData = await workspacesResponse.json()
      
      // Get form counts for each workspace
      const workspacesWithFormCounts = await Promise.all(
        workspacesData.map(async (workspace: any) => {
          const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms`)
          if (!formsResponse.ok) {
            return {
              ...workspace,
              // Remove emoji completely, even if it exists in the database
              emoji: undefined,
              formCount: 0
            }
          }
          
          const forms = await formsResponse.json()
          return {
            ...workspace,
            // Remove emoji completely, even if it exists in the database
            emoji: undefined,
            formCount: forms.length
          }
        })
      )
      
      setWorkspaces(workspacesWithFormCounts)
    } catch (error) {
      console.error('Error refreshing workspaces:', error)
      toast({
        title: 'Failed to refresh workspaces',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <CreateWorkspaceButton onSuccess={refreshWorkspaces} />
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 h-40 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No workspaces found</h3>
          <p className="text-muted-foreground mb-4">Create your first workspace to organize your forms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onEdit={handleEditWorkspace}
              onDelete={handleDeleteWorkspace}
            />
          ))}
        </div>
      )}
      
      {workspaceToEdit && (
        <WorkspaceModal
          isOpen={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open)
            if (!open) {
              setWorkspaceToEdit(null)
            }
          }}
          workspaceToEdit={workspaceToEdit}
          onSuccess={refreshWorkspaces}
        />
      )}
    </div>
  )
} 