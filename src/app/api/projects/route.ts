import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ProjectService } from '@/lib/projectService';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = ProjectService.getUserProjects(session.user.id);
    
    // 转换数据格式以匹配前端期望
    const formattedProjects = projects.map(project => ({
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

    // 异步处理项目生成
    processProjectGeneration(newProject.id);

    // 转换数据格式
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
  // 模拟生成过程，3秒后完成
  setTimeout(() => {
    try {
      const success = ProjectService.updateProjectStatus(projectId, 'completed', {
        name: `Landing Page #${projectId}`,
        landing_page_data: {
          sitemap: ["block_001", "block_002"],
          blocks: {
            block_001: {
              type: "navbar",
              subtype: "Navbar1",
              content: "content_001"
            },
            block_002: {
              type: "hero_header_section",
              subtype: "Layout1",
              content: "content_002"
            }
          },
          block_contents: {
            content_001: {
              logo_src: "/logo.png",
              button: "Get Started"
            },
            content_002: {
              title: "Build Beautiful Landing Pages",
              desc: "Create stunning landing pages with AI assistance. Fast, beautiful, and conversion-optimized.",
              button1: "Get Started",
              button2: "Learn More"
            }
          }
        }
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