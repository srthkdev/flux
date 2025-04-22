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
} from "lucide-react"

import { UserProfile } from "@/components/user-profile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { workspaceService } from "@/lib/services/workspace-service"
import { WorkspaceModal } from "@/components/workspace-modal"

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
  id: string
  form: {
    id: string;
    title: string;
  };
  createdAt: Date;
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
      <div className="flex items-center px-3 py-1 mb-1">
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
        const fetchFavorites = fetch(`/api/favorites?userId=${userData.id}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch favorites');
            }
            return response.json();
          })
          .then((data: FavoriteFromDB[]) => {
            // Transform to match our component's expected format
            const formattedFavorites: FavoriteProps[] = data.filter(fav => fav.form).map(fav => ({
              id: fav.id,
              form: {
                id: fav.form!.id,
                title: fav.form!.title
              },
              createdAt: fav.createdAt
            }));
            setFavorites(formattedFavorites);
          });
        
        // Fetch workspaces
        const fetchWorkspaces = fetch(`/api/workspace?userId=${userData.id}`)
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

  const handleCreateForm = () => {
    router.push('/dashboard/forms/new');
  };

  const handleCreateWorkspace = () => {
    setIsWorkspaceModalOpen(true);
  };

  const handleEditWorkspace = (workspace: WorkspaceProps) => {
    setWorkspaceToEdit(workspace);
    setIsWorkspaceModalOpen(true);
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
          <NavItem href="/dashboard/search" icon={Search}>
            Search
          </NavItem>
          <NavItem href="/dashboard/ai" icon={Sparkles}>
            Flux AI
          </NavItem>
        </div>
        
        {/* Favorites */}
        <NavSection title="Favorites">
          {favorites.length === 0 ? (
            <div className="px-3 py-2">
              <div className="p-2 bg-muted/40 rounded-md text-xs">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">No favorites yet</p>
                    <p className="text-muted-foreground">Star forms to add them to your favorites.</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto flex items-center gap-1 text-primary" 
                      onClick={handleCreateForm}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create a form</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            favorites.map((favorite) => (
              <NavItem 
                key={favorite.id} 
                href={`/dashboard/forms/${favorite.form.id}`} 
                icon={() => <span className="text-base">⭐</span>}
                active={pathname === `/dashboard/forms/${favorite.form.id}`}
              >
                {favorite.form.title}
              </NavItem>
            ))
          )}
        </NavSection>
        
        {/* Workspaces */}
        <NavSection title="Workspace">
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
                    <Link 
                      href={`/dashboard/workspace/${workspace.id}`}
                      className="flex items-center px-3 py-1 gap-2 text-sm rounded-md transition-colors duration-200 text-foreground hover:bg-muted flex-grow"
                    >
                      <span className="text-base">{workspace.emoji || '📁'}</span>
                      <span className="truncate">{workspace.name}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md"
                      onClick={() => handleEditWorkspace(workspace)}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {workspace.forms && workspace.forms.length === 0 && (
                    <div className="ml-8 mt-1">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary" 
                        onClick={() => router.push(`/dashboard/workspace/${workspace.id}/new`)}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add form</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              
              <NavItem 
                href="/dashboard/workspace" 
                icon={() => <span className="text-base">🔍</span>}
                active={pathname === "/dashboard/workspace"}
              >
                View all workspaces
              </NavItem>
            </>
          )}
        </NavSection>
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
          className="flex items-center justify-center mt-2 p-2 text-sm font-medium bg-muted/50 rounded-md hover:bg-muted transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
      

      {/* Workspace Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onOpenChange={(open) => {
          setIsWorkspaceModalOpen(open);
          if (!open) {
            setWorkspaceToEdit(null);
          }
        }}
        workspaceToEdit={workspaceToEdit || undefined}
        onSuccess={() => {
          // Refresh workspaces using API
          if (userData) {
            fetch(`/api/workspace?userId=${userData.id}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to fetch workspaces');
                }
                return response.json();
              })
              .then(workspacesData => {
                setWorkspaces(workspacesData.map((w: WorkspaceFromDB) => ({
                  id: w.id,
                  name: w.name,
                  emoji: w.emoji || undefined,
                  forms: [],
                })));
              })
              .catch(error => {
                console.error('Error refreshing workspaces:', error);
                setFetchError(error instanceof Error ? error.message : 'Unknown error');
              });
          }
        }}
      />
    </aside>
  )
} 