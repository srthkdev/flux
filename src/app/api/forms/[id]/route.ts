import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'
import { authService } from '@/lib/services/auth-service'
import { getAuth } from '@clerk/nextjs/server'

// Mark as dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

// Helper to get DB userId from Clerk userId
async function getDbUserId(clerkUserId: string | null): Promise<string | null> {
  if (!clerkUserId) return null;
  
  const user = await prismadb.user.findUnique({
    where: { externalId: clerkUserId },
    select: { id: true }
  });
  
  return user?.id || null;
}

// Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      });
    }
    
    // Handle "new" as a special case for creating a new form
    if (id === 'new') {
      return NextResponse.json({
        id: 'new',
        title: 'Untitled Form',
        description: '',
        published: false,
        fields: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Get the form from the database
    const form = await prismadb.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    
    if (!form) {
      return new NextResponse(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
      });
    }
    
    // For authenticated requests, check ownership
    const { userId: clerkUserId } = getAuth(request);
    if (clerkUserId) {
      // User is authenticated, get their database ID
      const userId = await getDbUserId(clerkUserId);
      
      // If user is authenticated but not the owner, check if form is published
      if (userId && userId !== form.userId) {
        const isPublished = await authService.isFormPublished(id);
        if (!isPublished) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized access to form' }), {
            status: 403,
          });
        }
      }
    } else {
      // For unauthenticated requests, only allow published forms
      const isPublished = await authService.isFormPublished(id);
      if (!isPublished) {
        return new NextResponse(JSON.stringify({ error: 'This form is not available' }), {
          status: 403,
        });
      }
    }
    
    // Parse the form schema if it exists
    const fields = form.schema ? JSON.parse(JSON.stringify(form.schema)) : [];
    
    return NextResponse.json({
      ...form,
      fields
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// Update a form
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      });
    }
    
    // Special case for new forms
    if (id === 'new') {
      return NextResponse.json({
        id: 'new',
        ...body,
        updatedAt: new Date()
      });
    }
    
    // Get authenticated user
    const { userId: clerkUserId } = getAuth(request);
    if (!clerkUserId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    
    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }
    
    // Verify user has access to this form
    const hasAccess = await authService.verifyFormAccess(id, userId);
    if (!hasAccess) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized access to form' }), {
        status: 403,
      });
    }
    
    // Extract fields from the body to store in schema
    const { fields, ...formData } = body;
    
    // Update the form in the database
    const updatedForm = await prismadb.form.update({
      where: { id },
      data: {
        ...formData,
        userId, // Ensure owner is set
        schema: fields ? fields : undefined,
      }
    });
    
    return NextResponse.json({
      ...updatedForm,
      fields: fields || []
    });
  } catch (error) {
    console.error('Error updating form:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      });
    }
    
    // Get authenticated user
    const { userId: clerkUserId } = getAuth(request);
    if (!clerkUserId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }
    
    // Get database user ID
    const userId = await getDbUserId(clerkUserId);
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }
    
    // Verify user has access to this form
    const hasAccess = await authService.verifyFormAccess(id, userId);
    if (!hasAccess) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized access to form' }), {
        status: 403,
      });
    }
    
    // Mark the form as deleted but keep in database
    await prismadb.form.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting form:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 