import fs from 'fs';
import path from 'path';

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

export class ProjectGenerator {
  private templatePath: string;
  private outputBasePath: string;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'template');
    this.outputBasePath = path.join(process.cwd(), 'generated-sites');
  }

  async generateProject(projectId: string, landingPageData: LandingPageData): Promise<string> {
    const projectPath = path.join(this.outputBasePath, projectId);
    
    // Copy template to project directory
    await this.copyTemplate(projectPath);
    
    // Generate App.tsx with dynamic content
    await this.generateAppComponent(projectPath, landingPageData);
    
    return projectPath;
  }

  private async copyTemplate(targetPath: string): Promise<void> {
    await fs.promises.mkdir(targetPath, { recursive: true });
    await this.copyDir(this.templatePath, targetPath);
  }

  private async copyDir(src: string, dest: string): Promise<void> {
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    
    await fs.promises.mkdir(dest, { recursive: true });
    
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDir(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }

  private async generateAppComponent(projectPath: string, landingPageData: LandingPageData): Promise<void> {
    const { sitemap, blocks, block_contents } = landingPageData;
    
    let imports = ['import React from \'react\';'];
    let components: string[] = [];
    
    // Generate components based on sitemap
    for (const blockId of sitemap) {
      const block = blocks[blockId];
      const content = block_contents[block.content];
      
      if (block.subtype === 'Navbar1') {
        imports.push('import Navbar from \'./components/Navbar\';');
        components.push(`      <Navbar logoSrc="${content.logo_src}" button="${content.button}" />`);
      } else if (block.subtype === 'Layout1') {
        imports.push('import HeroSection from \'./components/HeroSection\';');
        components.push(`      <HeroSection title="${content.title}" desc="${content.desc}" button1="${content.button1}" button2="${content.button2}" />`);
      }
    }
    
    // Remove duplicates from imports
    imports = [...new Set(imports)];
    
    const appContent = `${imports.join('\n')}

function App() {
  return (
    <div className="min-h-screen bg-white">
${components.join('\n')}
    </div>
  );
}

export default App;`;

    const appPath = path.join(projectPath, 'src', 'App.tsx');
    await fs.promises.writeFile(appPath, appContent);

    // Copy the actual component files from the main project
    await this.copyComponentFiles(projectPath, landingPageData);
  }

  private async copyComponentFiles(projectPath: string, landingPageData: LandingPageData): Promise<void> {
    const componentsDir = path.join(projectPath, 'src', 'components');
    await fs.promises.mkdir(componentsDir, { recursive: true });

    const mainComponentsPath = path.join(process.cwd(), 'src', 'components', 'landing-page');
    const { sitemap, blocks } = landingPageData;

    // Check which components we need
    const neededComponents = new Set<string>();
    for (const blockId of sitemap) {
      const block = blocks[blockId];
      if (block.subtype === 'Navbar1') {
        neededComponents.add('Navbar1');
      } else if (block.subtype === 'Layout1') {
        neededComponents.add('Layout1');
      }
    }

    // Copy and adapt component files
    for (const componentName of neededComponents) {
      const sourceFile = path.join(mainComponentsPath, `${componentName}.tsx`);
      let content = await fs.promises.readFile(sourceFile, 'utf-8');
      
      // Adapt the component for standalone use
      if (componentName === 'Navbar1') {
        // Rename interfaces and add proper prop types
        content = content.replace('interface Navbar1Props', 'interface NavbarProps');
        content = content.replace('{ logo_src, button }: Navbar1Props', '{ logoSrc, button }: NavbarProps');
        content = content.replace(/logo_src/g, 'logoSrc'); // Replace all occurrences
        content = content.replace('export default function Navbar1', 'export default function Navbar');
        
        const targetFile = path.join(componentsDir, 'Navbar.tsx');
        await fs.promises.writeFile(targetFile, content);
      } else if (componentName === 'Layout1') {
        // Rename interfaces and export
        content = content.replace('interface Layout1Props', 'interface HeroSectionProps');
        content = content.replace('{ title, desc, button1, button2 }: Layout1Props', '{ title, desc, button1, button2 }: HeroSectionProps');
        content = content.replace('export default function Layout1', 'export default function HeroSection');
        
        const targetFile = path.join(componentsDir, 'HeroSection.tsx');
        await fs.promises.writeFile(targetFile, content);
      }
    }
  }

  async buildProject(projectPath: string): Promise<string> {
    // For development, we'll create a simple HTML file that directly renders the components
    // In production, this would use actual Vite build process
    const distPath = path.join(projectPath, 'dist');
    await fs.promises.mkdir(distPath, { recursive: true });
    
    // Read the landing page data to generate the HTML
    const appPath = path.join(projectPath, 'src', 'App.tsx');
    const appContent = await fs.promises.readFile(appPath, 'utf-8');
    
    // For now, create a simplified HTML version
    // In a real implementation, we would run: npm install && npm run build
    const indexHtml = await this.generateStaticHtml(projectPath, appContent);
    
    await fs.promises.writeFile(path.join(distPath, 'index.html'), indexHtml);
    
    return distPath;
  }

  private async generateStaticHtml(projectPath: string, appContent: string): Promise<string> {
    // Extract component usage from App.tsx to render static HTML
    const componentsDir = path.join(projectPath, 'src', 'components');
    const componentFiles = await fs.promises.readdir(componentsDir).catch(() => []);
    
    // Simple static HTML generation based on component structure
    // This creates a working preview - in production you'd use the actual build process
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        // Component definitions will be injected here
        ${await this.getComponentDefinitions(componentsDir, componentFiles)}
        
        // App component
        ${await this.getAppDefinition(appContent)}
        
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
  }

  private async getComponentDefinitions(componentsDir: string, componentFiles: string[]): Promise<string> {
    let definitions = '';
    
    for (const file of componentFiles) {
      if (file.endsWith('.tsx')) {
        const componentPath = path.join(componentsDir, file);
        let content = await fs.promises.readFile(componentPath, 'utf-8');
        
        // Clean up TypeScript syntax for Babel browser compilation
        content = content.replace(/interface\s+\w+Props\s*\{[^}]*\}/g, ''); // Remove interfaces
        content = content.replace(/:\s*\w+Props/g, ''); // Remove type annotations
        content = content.replace(/as\s+\w+/g, ''); // Remove type assertions like "as HTMLImageElement"
        content = content.replace(/export default/g, ''); // Remove export default
        
        definitions += content + '\n\n';
      }
    }
    
    return definitions;
  }

  private async getAppDefinition(appContent: string): Promise<string> {
    // Clean up App component for browser compilation
    let cleanContent = appContent;
    cleanContent = cleanContent.replace(/import[^;]+;/g, ''); // Remove imports
    cleanContent = cleanContent.replace(/export default/g, ''); // Remove export default
    cleanContent = cleanContent.replace(/^\s*\w+\s*;\s*$/gm, ''); // Remove standalone statements like "App;"
    
    return cleanContent.trim();
  }

  async getDistPath(projectId: string): Promise<string> {
    return path.join(this.outputBasePath, projectId, 'dist');
  }
}

export const projectGenerator = new ProjectGenerator();