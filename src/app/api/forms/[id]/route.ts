import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Mark as dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

// Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      })
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
      })
    }
    
    // Get the form from the database
    const form = await prismadb.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    })
    
    if (!form) {
      return new NextResponse(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
      })
    }
    
    // Parse the form schema if it exists
    const fields = form.schema ? JSON.parse(JSON.stringify(form.schema)) : []
    
    return NextResponse.json({
      ...form,
      fields
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Update a form
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      })
    }
    
    // Special case for new forms
    if (id === 'new') {
      return NextResponse.json({
        id: 'new',
        ...body,
        updatedAt: new Date()
      })
    }
    
    // Extract fields from the body to store in schema
    const { fields, ...formData } = body
    
    // Update the form in the database
    const updatedForm = await prismadb.form.update({
      where: { id },
      data: {
        ...formData,
        schema: fields ? fields : undefined,
      }
    })
    
    return NextResponse.json({
      ...updatedForm,
      fields: fields || []
    })
  } catch (error) {
    console.error('Error updating form:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
      })
    }
    
    // Mark the form as deleted but keep in database
    await prismadb.form.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting form:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 