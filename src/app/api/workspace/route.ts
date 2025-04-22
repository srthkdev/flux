import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Mark as dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

// Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, emoji, userId } = body
    
    if (!name || !userId) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      })
    }
    
    const workspace = await prismadb.workspace.create({
      data: {
        name,
        emoji,
        userId,
      }
    })
    
    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error creating workspace:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Get all workspaces for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
      })
    }
    
    const workspaces = await prismadb.workspace.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 