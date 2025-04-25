"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Home,
  Search,
  Plus,
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Star,
  Info,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react"

import { UserProfile } from "@/components/user-profile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { workspaceService } from "@/lib/services/workspace-service"
import { WorkspaceModal } from "@/components/workspace-modal"
import { RainbowButton } from "./magicui/rainbow-button"
import { BorderBeam } from "./magicui/border-beam"
import { FormCreateModal } from "@/components/forms/form-create-modal"

interface NavItemProps {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}

interface NavSectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

interface FavoriteProps {
  id: string;
  formId: string;
  createdAt: Date;
  form: {
    id: string;
    title: string;
    description?: string;
    published?: boolean;
    workspace?: {
      id: string;
      name: string;
    }
  };
}

// Type for favorites from DB which need to be transformed
interface FavoriteFromDB {
  id: string;
  userId: string;
  formId: string;
  createdAt: Date;
  updatedAt: Date;
  form?: {
    id: string;
    title: string;
    description?: string;
    published?: boolean;
    workspace?: {
      id: string;
      name: string;
    }
  };
}

interface WorkspaceProps {
  id: string
  name: string
  emoji?: string
  forms?: Array<{
    id: string
    title: string
  }>;
}

interface WorkspaceFromDB {
  id: string
  name: string
  emoji?: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface FormFromDB {
  id: string
  title: string
  description?: string | null
  isDeleted: boolean
  userId: string
  [key: string]: any
}

interface UserData {
  id: string;
  externalId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

const NavItem = ({ href, icon: Icon, children, active, onClick }: NavItemProps) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-3 py-1.5 gap-2 text-sm rounded-md transition-colors duration-200",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{children}</span>
    </Link>
  )
}

const NavSection = ({ 
  title, 
  children, 
  collapsible = false, 
  defaultCollapsed = false 
}: NavSectionProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  
  return (
    <div className="my-2">
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        {collapsible ? (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center text-xs uppercase tracking-wider text-muted-foreground font-medium w-full"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            {title}
          </button>
        ) : (
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        )}
      </div>
      {!isCollapsed && (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  )
}

export function AppSidebarV2() {
  const pathname = usePathname()
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const [userData, setUserData] = React.useState<UserData | null>(null)
  const [favorites, setFavorites] = React.useState<FavoriteProps[]>([])
  const [workspaces, setWorkspaces] = React.useState<WorkspaceProps[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = React.useState(false)
  const [workspaceToEdit, setWorkspaceToEdit] = React.useState<WorkspaceProps | null>(null)
  const [expandedWorkspaces, setExpandedWorkspaces] = React.useState<Record<string, boolean>>({})
  const [loading, setLoading] = React.useState<Record<string, boolean>>({})
  const [workspaceForms, setWorkspaceForms] = React.useState<Record<string, FormFromDB[]>>({})
  const [isFormCreateModalOpen, setIsFormCreateModalOpen] = React.useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string | null>(null)
  
  // Get the current user data from API
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch user data');
        }
        
        const userData = await response.json();
        setUserData(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching current user:', error);
        setFetchError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        return null;
      }
    };
    
    fetchCurrentUser();
  }, [clerkUser, isLoaded]);
  
  // Load workspaces and favorites once we have the user data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      try {
        // Fetch favorites
        const fetchFavorites = fetchFavoritesData();
        
        // Fetch workspaces
        const fetchWorkspaces = fetch(`/api/workspace`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch workspaces');
            }
            return response.json();
          })
          .then((data: WorkspaceFromDB[]) => {
            // Transform to match our component's expected format
            const transformedWorkspaces: WorkspaceProps[] = data.map(workspace => ({
              id: workspace.id,
              name: workspace.name,
              emoji: workspace.emoji || undefined,
              forms: []
            }));
            setWorkspaces(transformedWorkspaces);
          });
        
        await Promise.all([fetchFavorites, fetchWorkspaces]);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
        setFetchError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userData) {
      fetchData();
    }
  }, [userData]);

  // Helper function to fetch favorites data
  const fetchFavoritesData = async () => {
    if (!userData) return Promise.resolve();
    
    try {
      const response = await fetch(`/api/favorites`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data: FavoriteFromDB[] = await response.json();
      
      // Transform to match our component's expected format
      const formattedFavorites: FavoriteProps[] = data
        .filter(fav => fav.form)
        .map(fav => ({
          id: fav.id,
          formId: fav.formId,
          createdAt: fav.createdAt,
          form: fav.form!
        }));
      
      setFavorites(formattedFavorites);
      return Promise.resolve();
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return Promise.reject(error);
    }
  };

  const handleCreateForm = async (workspaceId: string) => {
    if (!workspaceId) return;
    
    setSelectedWorkspaceId(workspaceId);
    setIsFormCreateModalOpen(true);
  };

  const handleFormCreateSuccess = (formId: string) => {
    router.push(`/dashboard/forms/${formId}`);
    if (selectedWorkspaceId) {
      fetchWorkspaceForms(selectedWorkspaceId);
    }
  };

  const handleCreateWorkspace = () => {
    setIsWorkspaceModalOpen(true);
  };

  const handleEditWorkspace = (workspace: WorkspaceProps) => {
    setWorkspaceToEdit(workspace);
    setIsWorkspaceModalOpen(true);
  };

  // Function to toggle workspace expansion
  const toggleWorkspaceExpansion = async (workspaceId: string) => {
    // Toggle the state
    setExpandedWorkspaces(prev => {
      const newState = { ...prev, [workspaceId]: !prev[workspaceId] };
      
      // If we're expanding and don't have forms yet, fetch them
      if (newState[workspaceId] && (!workspaceForms[workspaceId] || workspaceForms[workspaceId].length === 0)) {
        fetchWorkspaceForms(workspaceId);
      }
      
      return newState;
    });
  };
  
  // Function to fetch forms for a workspace
  const fetchWorkspaceForms = async (workspaceId: string) => {
    if (loading[workspaceId]) return;
    
    setLoading(prev => ({ ...prev, [workspaceId]: true }));
    
    try {
      // Add a timestamp parameter to avoid browser caching
      const timestamp = Date.now();
      const response = await fetch(`/api/workspace/${workspaceId}/forms?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const formsData = await response.json();
        setWorkspaceForms(prev => ({ ...prev, [workspaceId]: formsData }));
      }
    } catch (error) {
      console.error(`Error fetching forms for workspace ${workspaceId}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [workspaceId]: false }));
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, formId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userData) return;
    
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      
      const data = await response.json();
      
      // After toggling, always refresh favorites to get the latest data
      await fetchFavoritesData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Add a function to fetch workspaces
  const fetchWorkspaces = async () => {
    if (!userData) return;
    
    try {
      const response = await fetch(`/api/workspace`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      
      const workspacesData = await response.json();
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  // Show loading state for the sidebar
  if (isLoading) {
    return (
      <aside className="w-64 h-full flex flex-col border-r overflow-y-auto bg-background rounded-r-xl">
        <UserProfile />
        <div className="p-4 flex-1">
          <div className="h-6 bg-muted/30 rounded animate-pulse mb-4 w-1/2" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-full flex flex-col border-r overflow-y-auto bg-background rounded-r-xl">
      <UserProfile />
      
      {fetchError && (
        <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-xs">
          <p>Error loading data:</p>
          <p className="font-mono">{fetchError}</p>
        </div>
      )}
      
      <div className="p-2 flex-1 overflow-y-auto">
        {/* Main navigation */}
        <div className="space-y-1 px-1 py-2">
          <NavItem href="/dashboard" icon={Home} active={pathname === "/dashboard"}>
            Home
          </NavItem>
          <NavItem 
            href="#" 
            icon={Search} 
            onClick={() => router.push('/dashboard/search')}
            active={pathname === "/dashboard/search"}
          >
            Search
          </NavItem>
          <NavItem href="/dashboard/ai" icon={Sparkles}>
            Flux AI
          </NavItem>
        </div>
        
        {/* Favorites */}
        {favorites.length > 0 && (
          <NavSection title="Favorites">
            <div className="space-y-1">
              {favorites.map((favorite) => (
                <Link
                  key={favorite.id}
                  href={`/dashboard/forms/${favorite.form.id}`}
                  className={cn(
                    "flex items-center px-3 py-1.5 gap-2 text-sm rounded-md transition-colors duration-200",
                    pathname === `/dashboard/forms/${favorite.form.id}` 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Star className="h-4 w-4 text-gray-400 fill-gray-400" />
                  <span className="truncate">{favorite.form.title}</span>
                </Link>
              ))}
            </div>
          </NavSection>
        )}
        
        {/* Workspaces */}
        <div className="my-2">
          <div className="flex items-center justify-between px-0 py-1 mb-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">WORKSPACES</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-sm opacity-80 hover:opacity-100"
              onClick={handleCreateWorkspace}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            {workspaces.length === 0 ? (
              <div className="px-3 py-2">
                <div className="p-2 bg-muted/40 rounded-md text-xs">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">No workspaces</p>
                      <p className="text-muted-foreground">Create a workspace to organize your forms.</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto flex items-center gap-1 text-primary" 
                        onClick={handleCreateWorkspace}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create workspace</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="mb-1">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleWorkspaceExpansion(workspace.id)}
                        className="hover:bg-muted rounded-sm"
                      >
                        {expandedWorkspaces[workspace.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Link 
                        href={`/dashboard/workspace/${workspace.id}`}
                        className="flex items-center px-2 py-1 gap-2 text-sm rounded-md transition-colors duration-200 text-foreground hover:bg-muted flex-grow"
                      >
                        <span className="truncate font-medium">{workspace.name}</span>
                      </Link>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-sm opacity-80 hover:opacity-100"
                          onClick={() => handleEditWorkspace(workspace)}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-sm opacity-80 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateForm(workspace.id);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedWorkspaces[workspace.id] && (
                      <div className="ml-4 mb-2 space-y-0.5">
                        {loading[workspace.id] ? (
                          <div className="py-2 px-3">
                            <div className="h-4 bg-muted/40 rounded animate-pulse w-2/3 mb-2" />
                            <div className="h-4 bg-muted/40 rounded animate-pulse w-1/2" />
                          </div>
                        ) : !workspaceForms[workspace.id]?.length ? (
                          <div className="px-3 py-1 text-sm text-muted-foreground">
                            No forms
                          </div>
                        ) : (
                          workspaceForms[workspace.id].map((form) => (
                            <div key={form.id} className="flex items-center">
                              <Link 
                                href={`/dashboard/forms/${form.id}`}
                                className={cn(
                                  "flex items-center px-1.5 py-1 gap-1.5 text-sm rounded-md flex-grow text-foreground hover:bg-muted",
                                  pathname === `/dashboard/forms/${form.id}` && "bg-muted"
                                )}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                <span className="truncate">{form.title}</span>
                              </Link>
                              <button
                                onClick={(e) => toggleFavorite(e, form.id)}
                                className="h-5 w-5 rounded-sm opacity-80 hover:opacity-100 flex items-center justify-center"
                                title={favorites.some(f => f.formId === form.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={cn(
                                  "h-4 w-4",
                                  favorites.some(f => f.formId === form.id) 
                                    ? "text-gray-400 fill-gray-400" 
                                    : "text-gray-400"
                                )} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                <NavItem 
                  href="/dashboard/workspace" 
                  icon={FolderOpen}
                  active={pathname === "/dashboard/workspace"}
                >
                  View all workspaces
                </NavItem>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="mt-auto border-t p-2">
        <div className="space-y-1 px-1 py-1">
          <NavItem href="/dashboard/settings" icon={Settings}>
            Settings
          </NavItem>
          <NavItem href="/dashboard/trash" icon={Trash2}>
            Trash
          </NavItem>
        </div>
        
        <Link 
          href="/pricing" 
          className="flex items-center justify-center mt-2"
        >
        <Button className="relative overflow-hidden w-full bg-[#0f0f0f] text-white font-medium py-2 px-4 rounded-full" size="lg" variant="outline">
          upgrade to pro
        <BorderBeam
          size={80}
          initialOffset={40}
          className="from-transparent via-yellow-500 to-transparent"
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 30,
        }}
      />
    </Button>
        </Link>
       
      </div>
      

      {/* Form Create Modal */}
      <FormCreateModal
        isOpen={isFormCreateModalOpen}
        onOpenChange={setIsFormCreateModalOpen}
        workspaceId={selectedWorkspaceId || undefined}
        onSuccess={handleFormCreateSuccess}
      />
      
      {/* Workspace Modal */}
      <WorkspaceModal
        workspace={workspaceToEdit as { id: string; name: string; } | undefined}
        isOpen={isWorkspaceModalOpen}
        onOpenChange={(open) => {
          setIsWorkspaceModalOpen(open);
          if (!open) setWorkspaceToEdit(null);
        }}
        onSuccess={() => {
          if (workspaceToEdit) {
            setExpandedWorkspaces(prev => ({ ...prev, [workspaceToEdit.id]: true }));
          }
          fetchWorkspaces();
        }}
      />
    </aside>
  )
} 