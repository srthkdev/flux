import React from 'react';
import { useRouter } from "next/navigation";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    formCount: number | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
  onEdit: (workspace: any) => void;
  onDelete: (workspaceId: string) => void;
}

export function WorkspaceCard({ workspace, onEdit, onDelete }: WorkspaceCardProps) {
  const router = useRouter();
  
  const formattedDate = new Date(workspace.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const handleClick = () => {
    router.push(`/dashboard/workspace/${workspace.id}`);
  };
  
  return (
    <Card 
      className="border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg">
            {workspace.name}
          </CardTitle>
          <CardDescription>
            Last updated {formattedDate}
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
              onEdit(workspace);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit workspace
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workspace.id);
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
          {!workspace.formCount || workspace.formCount === 0
            ? 'No forms'
            : workspace.formCount === 1
              ? '1 form'
              : `${workspace.formCount} forms`}
        </p>
      </CardContent>
    </Card>
  );
} 