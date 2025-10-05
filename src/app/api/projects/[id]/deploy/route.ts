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
  const startTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] Starting deployment for project ${projectId}`);
  
  try {
    // 生成项目
    const generateStartTime = Date.now();
    console.log(`📦 [${new Date().toISOString()}] Generating project files...`);
    const projectPath = await projectGenerator.generateProject(projectId, landingPageData);
    const generateEndTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Project generation completed in ${generateEndTime - generateStartTime}ms`);
    
    // 构建项目
    const buildStartTime = Date.now();
    console.log(`🔨 [${new Date().toISOString()}] Starting build process...`);
    const distPath = await projectGenerator.buildProject(projectPath);
    const buildEndTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Build completed in ${buildEndTime - buildStartTime}ms`);
    
    // 生成子域名
    const subdomain = `project-${projectId}`;
    
    // 更新部署状态
    console.log(`💾 [${new Date().toISOString()}] Updating deployment status...`);
    ProjectService.setDeploymentStatus(projectId, 'completed', subdomain);
    
    // 更新项目信息
    ProjectService.updateProject(projectId, {
      deployed: true,
      subdomain,
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 [${new Date().toISOString()}] Project ${projectId} deployed successfully to subdomain: ${subdomain}`);
    console.log(`⏱️  Total deployment time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`📊 Breakdown: Generation: ${generateEndTime - generateStartTime}ms, Build: ${buildEndTime - buildStartTime}ms`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Deployment failed after ${totalTime}ms:`, error);
    ProjectService.setDeploymentStatus(projectId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
  }
}