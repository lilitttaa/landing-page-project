import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { projectGenerator } from '../../../../../lib/projectGenerator';
import { projects } from '../../route';

// In-memory deployment status tracking
const deploymentStatus = new Map<string, { status: 'deploying' | 'completed' | 'failed', subdomain?: string }>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = projects.find(p => p.id === projectId && p.userId === session.user.id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.status !== 'completed' || !project.landing_page_data) {
    return NextResponse.json({ error: 'Project not ready for deployment' }, { status: 400 });
  }

  // Set deployment status to deploying
  deploymentStatus.set(projectId, { status: 'deploying' });

  // Start deployment process asynchronously
  deployProject(projectId, project.landing_page_data).catch(error => {
    console.error('Deployment failed:', error);
    deploymentStatus.set(projectId, { status: 'failed' });
  });

  return NextResponse.json({ status: 'deploying' });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = params.id;
  const status = deploymentStatus.get(projectId);

  if (!status) {
    return NextResponse.json({ status: 'not_deployed' });
  }

  return NextResponse.json(status);
}

async function deployProject(projectId: string, landingPageData: any) {
  try {
    // Generate the project
    const projectPath = await projectGenerator.generateProject(projectId, landingPageData);
    
    // Build the project
    const distPath = await projectGenerator.buildProject(projectPath);
    
    // Generate subdomain (for now, using project ID)
    const subdomain = `project-${projectId}`;
    
    // Update deployment status
    deploymentStatus.set(projectId, { 
      status: 'completed', 
      subdomain 
    });
    
    // Update the project in memory
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      projects[projectIndex] = {
        ...projects[projectIndex],
        deployed: true,
        subdomain,
        updatedAt: new Date().toISOString()
      };
    }
    
    console.log(`Project ${projectId} deployed successfully to subdomain: ${subdomain}`);
  } catch (error) {
    console.error('Deployment error:', error);
    deploymentStatus.set(projectId, { status: 'failed' });
  }
}