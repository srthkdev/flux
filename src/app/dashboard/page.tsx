'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, FolderIcon, Trash2 } from 'lucide-react';

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
import { FormCreateModal } from '@/components/forms/form-create-modal';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const { forms, workspaces, isLoading, refetchData, forceRefresh } = useData();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isFormCreateModalOpen, setIsFormCreateModalOpen] = useState(false);
  const [formActionInProgress, setFormActionInProgress] = useState<Record<string, boolean>>({});
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>();

  // Function to create a new form
  const handleCreateForm = () => {
    if (workspaces.length > 0) {
      // Set the first workspace as default
      setSelectedWorkspaceId(workspaces[0].id);
      setIsFormCreateModalOpen(true);
    } else {
      // If no workspaces, open workspace modal first
      setIsWorkspaceModalOpen(true);
    }
  };

  // Function to open workspace modal
  const handleCreateWorkspace = () => {
    setIsWorkspaceModalOpen(true);
  };

  const handleDeleteForm = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    
    // Prevent multiple clicks
    if (formActionInProgress[formId]) return;
    
    setFormActionInProgress(prev => ({ ...prev, [formId]: true }));
    
    try {
      // Use the trash API endpoint to move the form to trash
      const response = await fetch(`/api/forms/${formId}/trash`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to move form to trash');
      }
      
      // Refresh data to update UI
      await forceRefresh();
      
      toast({
        title: 'Form moved to trash',
        description: 'The form has been moved to trash.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error moving form to trash:', error);
      toast({
        title: 'Error',
        description: 'Failed to move form to trash',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setFormActionInProgress(prev => ({ ...prev, [formId]: false }));
    }
  };

  // Handle successful form creation
  const handleFormCreateSuccess = (formId: string) => {
    router.push(`/dashboard/forms/${formId}`);
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
                    className="border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer group relative"
                    onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteForm(e, form.id)}
                          disabled={formActionInProgress[form.id]}
                        >
                          {formActionInProgress[form.id] ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form Create Modal */}
      <FormCreateModal
        isOpen={isFormCreateModalOpen}
        onOpenChange={setIsFormCreateModalOpen}
        workspaceId={selectedWorkspaceId}
        onSuccess={handleFormCreateSuccess}
      />

      {/* Workspace Modal */}
      <WorkspaceModal 
        isOpen={isWorkspaceModalOpen}
        onOpenChange={setIsWorkspaceModalOpen}
        onSuccess={() => {
          forceRefresh();
        }}
      />
    </>
  );
}
