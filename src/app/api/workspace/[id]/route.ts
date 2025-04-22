import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Get a specific workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Workspace ID is required' }), {
        status: 400,
      })
    }
    
    const workspace = await prismadb.workspace.findUnique({
      where: { id },
    })
    
    if (!workspace) {
      return new NextResponse(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
      })
    }
    
    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Update a workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, emoji } = body
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Workspace ID is required' }), {
        status: 400,
      })
    }
    
    const workspace = await prismadb.workspace.update({
      where: { id },
      data: {
        name,
        emoji,
      }
    })
    
    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Delete a workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Workspace ID is required' }), {
        status: 400,
      })
    }
    
    await prismadb.workspace.delete({
      where: { id },
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 