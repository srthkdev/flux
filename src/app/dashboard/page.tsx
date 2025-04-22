'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreHorizontal, FolderIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { workspaceService } from '@/lib/services/workspace-service';
import { CreateWorkspaceButton } from '@/components/workspace-modal';

interface FormItem {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
  published: boolean;
}

interface WorkspaceItem {
  id: string;
  name: string;
  emoji?: string;
  formCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !user) return;
      
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        // Fetch workspaces
        const workspacesResponse = await fetch(`/api/workspace`);
        if (!workspacesResponse.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        
        const workspacesData = await workspacesResponse.json();
        
        // Get form counts for each workspace
        const workspacesWithFormCounts = await Promise.all(
          workspacesData.map(async (workspace: any) => {
            const formsResponse = await fetch(`/api/workspace/${workspace.id}/forms`);
            if (!formsResponse.ok) {
              return {
                ...workspace,
                formCount: 0
              };
            }
            
            const forms = await formsResponse.json();
            return {
              ...workspace,
              formCount: forms.length
            };
          })
        );
        
        setWorkspaces(workspacesWithFormCounts);
        
        // Fetch user's forms
        const formsResponse = await fetch(`/api/forms`);
        if (!formsResponse.ok) {
          throw new Error('Failed to fetch forms');
        }
        
        const formsData = await formsResponse.json();
        setForms(formsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, isLoaded]);

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateForm = () => {
    router.push('/dashboard/forms/new');
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-medium">My workspace</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search forms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <CreateWorkspaceButton onSuccess={() => router.refresh()} />
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">My Workspaces</h2>
          <Button variant="outline" onClick={() => router.push('/dashboard/workspace')}>
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-border">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted/30 rounded animate-pulse w-3/4 mb-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted/30 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-4">Create workspaces to organize your forms</p>
            <CreateWorkspaceButton onSuccess={() => router.refresh()} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {workspaces.slice(0, 4).map((workspace) => (
              <Card 
                key={workspace.id} 
                className="border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/workspace/${workspace.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                  </div>
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
      </div>

      {/* Recent Forms Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Recent forms</h2>
        <Button variant="default" onClick={handleCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          New form
        </Button>
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
                <div className="h-4 bg-muted/30 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No forms yet</h3>
          <p className="text-muted-foreground mb-6">Start creating forms to collect responses.</p>
          <Button onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
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
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/forms/${form.id}/share`);
                    }}>
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement trash logic
                        workspaceService.moveToTrash(form.id).then(() => {
                          setForms(forms.filter(f => f.id !== form.id));
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
    </div>
  );
}
