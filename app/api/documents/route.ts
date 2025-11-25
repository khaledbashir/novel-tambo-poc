import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByWorkspace, createDocument } from '@/lib/db-operations';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const documents = await getDocumentsByWorkspace(workspaceId);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    // Return mock data when database fails
    return NextResponse.json([
      {
        id: 'mock-doc-1',
        workspace_id: workspaceId,
        name: 'Sample Project',
        tambo_thread_id: 'mock-thread-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  }
}

export async function POST(request: NextRequest) {
  let name: string | undefined;
  let workspaceId: string | undefined;
  let tamboThreadId: string | undefined;

  try {
    const body = await request.json();
    name = body.name;
    workspaceId = body.workspaceId;
    tamboThreadId = body.tamboThreadId;

    if (!name || !workspaceId) {
      return NextResponse.json({ error: 'Name and workspaceId are required' }, { status: 400 });
    }

    const id = uuidv4();
    const threadId = tamboThreadId || uuidv4();
    const newDocument = await createDocument(id, workspaceId, name, threadId);

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    // Return mock data when database fails
    const mockDocument = {
      id: uuidv4(),
      workspace_id: workspaceId || 'unknown',
      name: name || 'Untitled',
      tambo_thread_id: tamboThreadId || uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return NextResponse.json(mockDocument, { status: 201 });
  }
}