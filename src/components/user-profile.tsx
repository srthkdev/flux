'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { ChevronDown, LogOut, User, Settings, ChevronRight } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function UserProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!user) return null;

  const userInitials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.firstName?.[0] || 'U';

  return (
    <div className="flex items-center p-3 justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-1.5 h-auto w-auto flex items-center gap-2 rounded-full hover:bg-sidebar-accent">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{user.fullName || user.username || 'User'}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{user.fullName || user.username}</p>
              {user.emailAddresses && user.emailAddresses.length > 0 && (
                <p className="text-xs text-muted-foreground">{user.emailAddresses[0].emailAddress}</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex cursor-pointer items-center gap-2 py-1.5"
            onClick={() => router.push('/user-profile')}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex cursor-pointer items-center gap-2 py-1.5"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex cursor-pointer items-center gap-2 py-1.5 text-destructive focus:text-destructive"
            onClick={() => signOut(() => router.push('/'))}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button 
        variant="ghost" 
        className="h-7 w-7 p-0 rounded-full hover:bg-sidebar-accent"
        onClick={() => router.push('/user-profile')}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Collapse sidebar</span>
      </Button>
    </div>
  );
} 