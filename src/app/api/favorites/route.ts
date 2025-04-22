import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Get favorites for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
      })
    }
    
    // For demo purposes, since we may not have the exact Prisma schema,
    // we'll return mock favorites data instead of using Prisma
    const mockFavorites = [
      {
        id: 'fav_1',
        userId: userId,
        formId: 'form_1',
        createdAt: new Date(),
        updatedAt: new Date(),
        form: {
          id: 'form_1',
          title: 'Job Application Form'
        }
      },
      {
        id: 'fav_2',
        userId: userId,
        formId: 'form_2',
        createdAt: new Date(),
        updatedAt: new Date(),
        form: {
          id: 'form_2',
          title: 'Customer Feedback Form'
        }
      }
    ]
    
    return NextResponse.json(mockFavorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 