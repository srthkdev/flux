'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, FolderIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
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
import { WorkspaceModal } from '@/components/workspace-modal';
import { DashboardHeader } from '@/components/dashboard-header';
import { useData } from '@/contexts/DataContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const { forms, workspaces, isLoading, refetchData } = useData();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  // Function to create a new form in the first workspace or open workspace modal if no workspaces
  const handleCreateForm = async () => {
    if (workspaces.length > 0) {
      try {
        // Create form in the first workspace
        const workspace = workspaces[0];
        const formResponse = await fetch(`/api/workspace/${workspace.id}/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Untitled',
            description: '',
          }),
        });
        
        if (!formResponse.ok) {
          throw new Error('Failed to create form');
        }
        
        const newForm = await formResponse.json();
        router.push(`/dashboard/forms/${newForm.id}`);
        
        // Refresh data after creating a form
        refetchData();
      } catch (error) {
        console.error('Error creating form:', error);
      }
    } else {
      // If no workspaces, open workspace modal first
      setIsWorkspaceModalOpen(true);
    }
  };

  // Function to open workspace modal
  const handleCreateWorkspace = () => {
    setIsWorkspaceModalOpen(true);
  };

  return (
    <>
      <DashboardHeader />

      <div className="container mx-auto py-6 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Home</h2>
          <div className="flex items-center gap-3 mb-10">
            <Button 
              variant="outline" 
              className="border-gray-200 hover:bg-gray-50 text-sm"
              onClick={handleCreateWorkspace}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
              New workspace
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-sm"
              onClick={handleCreateForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              New form
            </Button>
          </div>
        </div>

        {/* My workspaces section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">My workspaces</h3>
            <div className="ml-3 flex-grow h-px bg-gray-200"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
              ))
            ) : workspaces.length === 0 ? (
              <div className="col-span-full">
                <p className="text-gray-500 text-sm">No workspaces yet. Create your first workspace to get started.</p>
              </div>
            ) : (
              workspaces.slice(0, 3).map((workspace) => (
                <div
                  key={workspace.id}
                  className="border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer p-4"
                  onClick={() => router.push(`/dashboard/workspace/${workspace.id}`)}
                >
                  <div className="flex flex-col">
                    <h3 className="text-base font-medium">{workspace.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {workspace.formCount || 0} form{workspace.formCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent forms section */}
        <div>
          <div className="flex items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500">Recent forms</h3>
            <div className="ml-3 flex-grow h-px bg-gray-200"></div>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
                ))}
              </>
            ) : forms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No forms yet. Create your first form to get started.</p>
                <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New form
                </Button>
              </div>
            ) : (
              <>
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium">{form.title}</h3>
                          {!form.published && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Draft</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Edited {new Date(form.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add WorkspaceModal component */}
      <WorkspaceModal 
        isOpen={isWorkspaceModalOpen}
        onOpenChange={setIsWorkspaceModalOpen}
        onSuccess={() => {
          refetchData();
        }}
      />
    </>
  );
}
