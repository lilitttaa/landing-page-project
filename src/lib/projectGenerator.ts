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
  }

  async buildProject(projectPath: string): Promise<string> {
    // Since we can't use exec in edge runtime, we'll simulate the build
    // In a real implementation, this would be done via a separate build service
    const distPath = path.join(projectPath, 'dist');
    await fs.promises.mkdir(distPath, { recursive: true });
    
    // Create a simple index.html that loads the generated content
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        // Simple React app rendering
        const { useState, useEffect } = React;
        
        function Navbar({ logoSrc, button }) {
            return React.createElement('nav', {
                className: 'bg-white shadow-sm border-b border-gray-200'
            }, React.createElement('div', {
                className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
            }, React.createElement('div', {
                className: 'flex justify-between items-center h-16'
            }, [
                React.createElement('div', { className: 'flex items-center', key: 'logo' },
                    React.createElement('img', { className: 'h-8 w-auto', src: logoSrc, alt: 'Logo' })
                ),
                React.createElement('div', { key: 'button' },
                    React.createElement('button', {
                        className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
                    }, button)
                )
            ])));
        }
        
        function HeroSection({ title, desc, button1, button2 }) {
            return React.createElement('div', {
                className: 'bg-white'
            }, React.createElement('div', {
                className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20'
            }, React.createElement('div', {
                className: 'text-center'
            }, [
                React.createElement('h1', {
                    className: 'text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl',
                    key: 'title'
                }, title),
                React.createElement('p', {
                    className: 'mt-6 max-w-3xl mx-auto text-xl text-gray-600',
                    key: 'desc'
                }, desc),
                React.createElement('div', {
                    className: 'mt-10 flex justify-center space-x-4',
                    key: 'buttons'
                }, [
                    React.createElement('button', {
                        className: 'bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors',
                        key: 'btn1'
                    }, button1),
                    React.createElement('button', {
                        className: 'bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg transition-colors',
                        key: 'btn2'
                    }, button2)
                ])
            ])));
        }
        
        function App() {
            return React.createElement('div', {
                className: 'min-h-screen bg-white'
            }, [
                React.createElement(Navbar, {
                    logoSrc: '/logo.png',
                    button: 'Get Started',
                    key: 'navbar'
                }),
                React.createElement(HeroSection, {
                    title: 'Build Beautiful Landing Pages',
                    desc: 'Create stunning landing pages with AI assistance. Fast, beautiful, and conversion-optimized.',
                    button1: 'Get Started',
                    button2: 'Learn More',
                    key: 'hero'
                })
            ]);
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
</body>
</html>`;

    await fs.promises.writeFile(path.join(distPath, 'index.html'), indexHtml);
    
    return distPath;
  }

  async getDistPath(projectId: string): Promise<string> {
    return path.join(this.outputBasePath, projectId, 'dist');
  }
}

export const projectGenerator = new ProjectGenerator();