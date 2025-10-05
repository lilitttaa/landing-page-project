
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ProjectService } from '@/lib/projectService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = params.id;
  const userId = session.user.id;

  try {
    const project = ProjectService.getUserProject(projectId, userId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { landing_page_data } = await request.json();

    if (!landing_page_data) {
      return NextResponse.json({ error: 'Missing landing_page_data' }, { status: 400 });
    }

    const success = ProjectService.updateProject(projectId, { landing_page_data });

    if (success) {
      return NextResponse.json({ message: 'Project updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
