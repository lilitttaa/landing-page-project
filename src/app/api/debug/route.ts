import { NextRequest, NextResponse } from 'next/server';
import { projects } from '../projects/route';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    projects: projects.length,
    projectData: projects,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const { action } = await request.json();
  
  if (action === 'clear') {
    projects.length = 0;
    return NextResponse.json({ message: 'Projects cleared', projects: projects.length });
  }
  
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}