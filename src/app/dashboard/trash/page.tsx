'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Undo, Trash2, AlertCircle } from 'lucide-react';

import { workspaceService } from '@/lib/services/workspace-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface UserData {
  id: string;
  externalId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

interface FormItemProps {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: Date;
}

// Demo data for fallback
const DEMO_TRASH_ITEMS: FormItemProps[] = [
  {
    id: "1",
    title: "Sample Deleted Form",
    description: "This is a sample form shown because we couldn't load the real trash items.",
    updatedAt: new Date()
  }
];

export default function TrashPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [trashItems, setTrashItems] = useState<FormItemProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current user data from API
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch user data');
        }
        
        const userData = await response.json();
        setUserData(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching current user:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        return null;
      }
    };
    
    fetchCurrentUser();
  }, [clerkUser, isLoaded]);

  // Load trash items once we have the user data
  useEffect(() => {
    const fetchTrashItems = async () => {
      if (!userData) return;
      
      try {
        const items = await workspaceService.getTrashItems(userData.id);
        setTrashItems(items);
      } catch (error) {
        console.error('Failed to fetch trash items:', error);
        setError('Failed to load trash items. Using sample data.');
        setTrashItems(DEMO_TRASH_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };

    if (userData) {
      fetchTrashItems();
    }
  }, [userData]);

  const handleRestore = async (formId: string) => {
    try {
      await workspaceService.restoreFromTrash(formId);
      // Update UI without refetching
      setTrashItems(trashItems.filter(item => item.id !== formId));
      router.refresh();
    } catch (error) {
      console.error('Failed to restore item:', error);
      setError('Failed to restore item. Please try again.');
    }
  };

  const handleEmptyTrash = async () => {
    if (!userData) return;
    
    try {
      await workspaceService.emptyTrash(userData.id);
      setTrashItems([]);
      router.refresh();
    } catch (error) {
      console.error('Failed to empty trash:', error);
      setError('Failed to empty trash. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Trash</h1>
        <div className="flex items-center justify-center h-64">
          <div className="space-y-4 w-full max-w-md">
            <div className="h-8 bg-muted/30 rounded animate-pulse w-1/3 mx-auto" />
            <div className="h-32 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trash</h1>
        {trashItems.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleEmptyTrash}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {trashItems.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <Trash2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">Trash is empty</h2>
          <p className="text-muted-foreground">Items moved to trash will appear here for 30 days before being permanently deleted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trashItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  Moved to trash on {new Date(item.updatedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground truncate">
                  {item.description || 'No description'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRestore(item.id)}
                  className="flex items-center gap-1"
                >
                  <Undo className="h-4 w-4" />
                  Restore
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 