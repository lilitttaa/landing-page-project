import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

interface LandingPageBlock {
  type: string;
  subtype: string;
  content: string;
}

interface LandingPageContent {
  [key: string]: any;
}

interface LandingPageData {
  sitemap: string[];
  blocks: {
    [key: string]: LandingPageBlock;
  };
  block_contents: {
    [key: string]: LandingPageContent;
  };
}

interface Project {
  id: string;
  userId: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  name?: string;
  createdAt: string;
  updatedAt: string;
  landing_page_data?: LandingPageData;
  deployed?: boolean;
}

let projects: Project[] = [];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userProjects = projects.filter(project => project.userId === session.user.id);
  return NextResponse.json(userProjects);
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

    const newProject: Project = {
      id: Date.now().toString(),
      userId: session.user.id,
      description: description.trim(),
      status: 'generating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.push(newProject);

    setTimeout(() => {
      const projectIndex = projects.findIndex(p => p.id === newProject.id);
      if (projectIndex !== -1) {
        projects[projectIndex] = {
          ...projects[projectIndex],
          status: 'completed',
          name: `Landing Page #${newProject.id}`,
          updatedAt: new Date().toISOString(),
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
        };
      }
    }, 3000);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}