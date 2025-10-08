import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ProjectService } from '@/lib/projectService';
import { buildDefaultLandingPageData } from '@/lib/landingPageDefaults';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = ProjectService.getUserProjects(session.user.id);

    // Convert data shape to match frontend expectations
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      userId: project.user_id,
      name: project.name,
      description: project.description,
      status: project.status,
      deployed: project.deployed,
      subdomain: project.subdomain,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      landing_page_data: project.landing_page_data,
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { description } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const newProject = ProjectService.createProject(session.user.id, description);

    // Kick off asynchronous project generation
    processProjectGeneration(newProject.id);

    const formattedProject = {
      id: newProject.id,
      userId: newProject.user_id,
      description: newProject.description,
      status: newProject.status,
      deployed: newProject.deployed,
      createdAt: newProject.created_at,
      updatedAt: newProject.updated_at,
    };

    return NextResponse.json(formattedProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processProjectGeneration(projectId: string) {
  // Simulate async generation step completing after 3 seconds
  setTimeout(() => {
    try {
      const project = ProjectService.getProjectById(projectId);
      const landingPageData = buildDefaultLandingPageData({
        projectId,
        description: project?.description,
      });
      const projectName = project?.name || `Landing Page #${projectId}`;

      const success = ProjectService.updateProjectStatus(projectId, 'completed', {
        name: projectName,
        landing_page_data: landingPageData,
      });

      if (!success) {
        console.error('Failed to update project status');
        ProjectService.updateProjectStatus(projectId, 'failed');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      ProjectService.updateProjectStatus(projectId, 'failed');
    }
  }, 3000);
}
