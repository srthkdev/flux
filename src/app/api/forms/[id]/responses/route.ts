import { NextRequest, NextResponse } from 'next/server'
import prismadb from '@/lib/db'

// Get responses for a specific form
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
    
    const responses = await prismadb.formResponse.findMany({
      where: { formId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(responses)
  } catch (error) {
    console.error('Error fetching form responses:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

// Submit a new response for a form
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    
    // Validate form ID
    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }
    
    // Check if form exists and is published
    const form = await prismadb.form.findUnique({
      where: { id: formId },
    })
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    
    if (!form.published) {
      return NextResponse.json(
        { error: 'This form is not accepting responses' },
        { status: 403 }
      )
    }
    
    // Get the form data
    const data = await request.json()
    
    // Create the response
    const response = await prismadb.formResponse.create({
      data: {
        formId,
        data: data as any,
      },
    })
    
    return NextResponse.json({ success: true, responseId: response.id })
  } catch (error) {
    console.error('Error creating form response:', error)
    return NextResponse.json(
      { error: 'Failed to submit form response' },
      { status: 500 }
    )
  }
} 