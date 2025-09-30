import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { projectGenerator } from '../../../../lib/projectGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const subdomain = slug[0];
    const assetPath = slug.slice(1).join('/');
    
    // Extract project ID from subdomain
    const projectId = subdomain.replace('project-', '');
    
    // Get the path to the built project
    const distPath = await projectGenerator.getDistPath(projectId);
    const filePath = path.join(distPath, assetPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await fs.promises.readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.json': 'application/json',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}