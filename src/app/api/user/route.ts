import { NextResponse } from 'next/server';
import prismadb from '@/lib/db';

// Get user info and create in database if doesn't exist
export async function GET() {
  try {
    // Mock user data for demo
    const mockUser = {
      id: 'user_1',
      externalId: 'clerk_user_1',
      email: 'user@example.com',
      name: 'Demo User',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    };
    
    // Check if user exists in the database
    let user = await prismadb.user.findUnique({
      where: { externalId: mockUser.externalId },
    });
    
    // If user doesn't exist, create a new user
    if (!user) {
      user = await prismadb.user.create({
        data: {
          externalId: mockUser.externalId,
          email: mockUser.email,
          name: mockUser.name,
          imageUrl: mockUser.imageUrl,
        },
      });
    }
    
    return NextResponse.json({
      id: user.id,
      externalId: user.externalId,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error('Error in user API:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 