import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'
import { getAuth } from '@clerk/nextjs/server'
import { formSchema } from '@/schemas/form'
import { prepareFieldsForAPI, prepareFieldsForUI } from '@/lib/form-helpers'
import { authService } from '@/lib/services/auth-service'

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
    
    // Handle "new" as a special case for creating a new form
    if (id === 'new') {
      return NextResponse.json({
        id: 'new',
        title: 'Untitled Form',
        description: '',
        published: false,
        fields: [],
        banner: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Get authenticated user for regular form queries
    const { userId: clerkUserId } = getAuth(request);
    
    // Basic validation
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      });
    }
    
    // Special case for public form access
    const isPublic = new URL(request.url).searchParams.get('public') === 'true';
    
    let form;
    if (isPublic) {
      // For public access, only get published forms
      form = await prismadb.form.findFirst({
        where: {
          id,
          published: true,
          isDeleted: false
        }
      });
      
      if (!form) {
        return new NextResponse(JSON.stringify({ error: 'Form not found or not published' }), {
          status: 404,
        });
      }
    } else {
      // For private access, check user auth
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
      
      // Get the form and check access
      form = await prismadb.form.findFirst({
        where: {
          id,
          userId,
          isDeleted: false
        }
      });
      
      if (!form) {
        return new NextResponse(JSON.stringify({ error: 'Form not found' }), {
          status: 404,
        });
      }
    }
    
    // Parse the form schema if it exists
    const schema = form.schema ? JSON.parse(JSON.stringify(form.schema)) : {};
    
    // Extract fields and metadata from the schema
    let fields = [];
    let metadata = { banner: '' };
    
    // Handle both old format (array) and new format (object with fields and metadata)
    if (schema.fields && Array.isArray(schema.fields)) {
      fields = schema.fields;
      metadata = schema.metadata || { banner: '' };
    } else if (Array.isArray(schema)) {
      fields = schema;
    }
    
    // Convert fields for UI display
    const uiFields = prepareFieldsForUI(fields);
    
    return NextResponse.json({
      ...form,
      fields: uiFields,
      banner: metadata.banner || '' // Include banner from metadata
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
      const { banner, ...rest } = body;
      return NextResponse.json({
        id: 'new',
        ...rest,
        banner: banner || '',
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
    const { fields, workspaceId, banner, ...formData } = body;
    
    // Ensure fields are properly formatted for the database schema
    const schemaFields = prepareFieldsForAPI(fields || []);
    
    // Create metadata to store with schema
    const formMetadata = {
      banner: banner || ''
    };
    
    // Create schema object with fields and metadata
    const schemaObject = { 
      fields: schemaFields,
      metadata: formMetadata
    };
    
    // Validate form data with Zod after mapping field types
    try {
      // Create a sanitized payload for validation
      const validationPayload = {
        ...formData,
        fields: schemaFields,
        workspaceId: workspaceId || undefined,
        banner: banner || undefined,
      };
      
      formSchema.parse(validationPayload);
    } catch (validationError) {
      console.error('Form validation error:', validationError);
      return new NextResponse(JSON.stringify({ 
        error: 'Invalid form data', 
        details: validationError 
      }), {
        status: 400,
      });
    }
    
    // Update the form in the database
    const updatedForm = await prismadb.form.update({
      where: { id },
      data: {
        ...formData,
        // Use user relation instead of userId field directly
        user: {
          connect: { id: userId }
        },
        schema: schemaObject, // Store fields and metadata in schema
        // Handle workspace relationship correctly
        workspace: workspaceId 
          ? { connect: { id: workspaceId } }
          : workspaceId === null 
            ? { disconnect: true }
            : undefined
      }
    });
    
    // Extract data from the schema
    const savedSchema = updatedForm.schema ? JSON.parse(JSON.stringify(updatedForm.schema)) : {};
    const savedFields = savedSchema.fields || [];
    const savedMetadata = savedSchema.metadata || {};
    
    // Convert schema back to UI field format for response
    const uiFields = prepareFieldsForUI(savedFields);
    
    return NextResponse.json({
      ...updatedForm,
      fields: uiFields,
      banner: savedMetadata.banner || '' // Return banner from metadata
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