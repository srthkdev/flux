import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Mark as dynamic to prevent static analysis issues
export const dynamic = 'force-dynamic';

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
    
    // Get real favorites data from database
    const favorites = await prismadb.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get the form details for each favorite
    const formIds = favorites.map((fav: { formId: string }) => fav.formId);
    const forms = await prismadb.form.findMany({
      where: { 
        id: { in: formIds },
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
      }
    });

    // Combine the data
    const result = favorites.map((favorite: { formId: string, [key: string]: any }) => {
      const form = forms.find((f: { id: string }) => f.id === favorite.formId);
      return {
        ...favorite,
        form
      };
    });
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
} 