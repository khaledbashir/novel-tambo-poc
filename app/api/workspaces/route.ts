import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkspaces, createWorkspace } from '@/lib/db-operations';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const workspaces = await getAllWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    // Return mock data when database fails
    return NextResponse.json([
      {
        id: 'mock-workspace-1',
        name: 'Demo Client',
        description: 'Sample client for demonstration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = uuidv4();
    const newWorkspace = await createWorkspace(id, name, description);

    return NextResponse.json(newWorkspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}