import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Mark as dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

// Get forms for a specific workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Workspace ID is required' }), {
        status: 400,
      })
    }
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
      })
    }
    
    const forms = await prismadb.form.findMany({
      where: { 
        workspaceId: id, 
        userId,
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    return NextResponse.json(forms)
  } catch (error) {
    console.error('Error fetching workspace forms:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Create a new form in a workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, description, userId } = body
    
    if (!id || !userId || !title) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      })
    }
    
    const form = await prismadb.form.create({
      data: {
        title,
        description: description || '',
        userId,
        workspaceId: id,
        isDeleted: false,
      }
    })
    
    return NextResponse.json(form)
  } catch (error) {
    console.error('Error creating form:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 