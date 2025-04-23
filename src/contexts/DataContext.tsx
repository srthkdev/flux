'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'

// Define types for the data we'll store in context
interface FormItem {
  id: string
  title: string
  description: string | null
  updatedAt: Date
  published: boolean
  workspaceId?: string
}

interface WorkspaceItem {
  id: string
  name: string
  emoji?: string
  formCount?: number
  createdAt: Date
  updatedAt: Date
}

interface DataContextType {
  forms: FormItem[]
  workspaces: WorkspaceItem[]
  isLoading: boolean
  error: string | null
  refetchData: () => Promise<void>
  searchForms: (query: string) => FormItem[]
  searchWorkspaces: (query: string) => WorkspaceItem[]
  getWorkspaceForms: (workspaceId: string) => FormItem[]
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  forms: [],
  workspaces: [],
  isLoading: true,
  error: null,
  refetchData: async () => {},
  searchForms: () => [],
  searchWorkspaces: () => [],
  getWorkspaceForms: () => []
})

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [forms, setForms] = useState<FormItem[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0) // Track last fetch time
  const CACHE_TIME = 60000 // 1 minute cache

  // Function to fetch all data
  const fetchData = async () => {
    if (!isUserLoaded || !user) return

    const now = Date.now()
    // If data was fetched recently, don't fetch again
    if (forms.length > 0 && now - lastFetchTime < CACHE_TIME) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch workspaces
      const workspacesResponse = await fetch('/api/workspace', { cache: 'no-store' })
      if (!workspacesResponse.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      
      const workspacesData = await workspacesResponse.json()
      
      // Get form counts for each workspace concurrently
      const workspacesWithFormCounts = await Promise.all(
        workspacesData.map(async (workspace: any) => {
          const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms`, { cache: 'no-store' })
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
      
      // Fetch all forms
      const formsResponse = await fetch('/api/forms', { cache: 'no-store' })
      if (!formsResponse.ok) {
        throw new Error('Failed to fetch forms')
      }
      
      const formsData = await formsResponse.json()
      setForms(formsData)
      setLastFetchTime(now)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error fetching data')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on initial load
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchData()
    }
  }, [isUserLoaded, user])

  // Search functions
  const searchForms = (query: string): FormItem[] => {
    if (!query.trim()) return forms
    
    const lowerQuery = query.toLowerCase()
    return forms.filter(form => 
      form.title.toLowerCase().includes(lowerQuery) || 
      (form.description && form.description.toLowerCase().includes(lowerQuery))
    )
  }

  const searchWorkspaces = (query: string): WorkspaceItem[] => {
    if (!query.trim()) return workspaces
    
    const lowerQuery = query.toLowerCase()
    return workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(lowerQuery)
    )
  }

  // Get forms for a specific workspace
  const getWorkspaceForms = (workspaceId: string): FormItem[] => {
    return forms.filter(form => form.workspaceId === workspaceId)
  }

  // Context value
  const value = {
    forms,
    workspaces,
    isLoading,
    error,
    refetchData: fetchData,
    searchForms,
    searchWorkspaces,
    getWorkspaceForms
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// Custom hook to use the data context
export const useData = () => useContext(DataContext) 