import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { projectGenerator } from '../../../lib/projectGenerator';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function DeployedProjectPage({ params }: PageProps) {
  try {
    const { subdomain } = await params;
    
    // Extract project ID from subdomain (format: project-{id})
    const projectId = subdomain.replace('project-', '');
    
    // Get the path to the built project
    const distPath = await projectGenerator.getDistPath(projectId);
    const indexPath = path.join(distPath, 'index.html');
    
    // Check if the built project exists
    if (!fs.existsSync(indexPath)) {
      return notFound();
    }
    
    // Read the index.html file
    let html = await fs.promises.readFile(indexPath, 'utf-8');
    
    // Replace relative paths with absolute paths for assets
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${subdomain}.yourdomain.com` 
      : `http://${subdomain}.localhost:3003`;
    
    // Update asset paths to point to our API endpoint
    html = html.replace(
      /href="\.\//g, 
      `href="/api/deployed/${subdomain}/`
    );
    html = html.replace(
      /src="\.\//g, 
      `src="/api/deployed/${subdomain}/`
    );
    
    return (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    );
  } catch (error) {
    console.error('Error serving deployed project:', error);
    return notFound();
  }
}