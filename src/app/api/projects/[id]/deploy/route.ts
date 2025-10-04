import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { projectGenerator } from '../../../../../lib/projectGenerator';
import { ProjectService } from '../../../../../lib/projectService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = ProjectService.getUserProject(projectId, session.user.id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.status !== 'completed' || !project.landing_page_data) {
    return NextResponse.json({ error: 'Project not ready for deployment' }, { status: 400 });
  }

  // 设置部署状态为deploying
  ProjectService.setDeploymentStatus(projectId, 'deploying');

  // 开始异步部署过程
  deployProject(projectId, project.landing_page_data).catch(error => {
    console.error('Deployment failed:', error);
    ProjectService.setDeploymentStatus(projectId, 'failed', undefined, error.message);
  });

  return NextResponse.json({ status: 'deploying' });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;
  const status = ProjectService.getDeploymentStatus(projectId);

  if (!status) {
    return NextResponse.json({ status: 'not_deployed' });
  }

  return NextResponse.json({
    status: status.status,
    subdomain: status.subdomain,
    error_message: status.error_message,
  });
}

async function deployProject(projectId: string, landingPageData: any) {
  try {
    // 生成项目
    const projectPath = await projectGenerator.generateProject(projectId, landingPageData);
    
    // 构建项目
    const distPath = await projectGenerator.buildProject(projectPath);
    
    // 生成子域名
    const subdomain = `project-${projectId}`;
    
    // 更新部署状态
    ProjectService.setDeploymentStatus(projectId, 'completed', subdomain);
    
    // 更新项目信息
    ProjectService.updateProject(projectId, {
      deployed: true,
      subdomain,
    });
    
    console.log(`Project ${projectId} deployed successfully to subdomain: ${subdomain}`);
  } catch (error) {
    console.error('Deployment error:', error);
    ProjectService.setDeploymentStatus(projectId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
  }
}