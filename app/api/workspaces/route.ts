import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkspaces, createWorkspace } from '@/lib/db-operations';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    console.log('Fetching workspaces...');
    const workspaces = await getAllWorkspaces();
    console.log('Workspaces fetched:', workspaces);
    return NextResponse.json(workspaces);
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({
      error: 'Failed to fetch workspaces',
      details: error.message,
      code: error.code
    }, { status: 500 });
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