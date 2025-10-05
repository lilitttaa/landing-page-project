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
    console.log(`🏗️  [${new Date().toISOString()}] Starting project generation for ${projectId}`);
    const projectPath = path.join(this.outputBasePath, projectId);
    
    // Copy template to project directory
    const templateStartTime = Date.now();
    console.log(`📁 [${new Date().toISOString()}] Copying template...`);
    await this.copyTemplate(projectPath);
    console.log(`✅ Template copied in ${Date.now() - templateStartTime}ms`);
    
    // Copy and adapt components with dependencies
    const componentsStartTime = Date.now();
    console.log(`🧩 [${new Date().toISOString()}] Copying components and dependencies...`);
    await this.copyComponentsWithDependencies(projectPath, landingPageData);
    console.log(`✅ Components copied in ${Date.now() - componentsStartTime}ms`);
    
    // Generate App.tsx with dynamic content
    const appStartTime = Date.now();
    console.log(`⚛️  [${new Date().toISOString()}] Generating App component...`);
    await this.generateAppComponent(projectPath, landingPageData);
    console.log(`✅ App component generated in ${Date.now() - appStartTime}ms`);
    
    // Copy tailwind configuration
    const tailwindStartTime = Date.now();
    console.log(`🎨 [${new Date().toISOString()}] Copying Tailwind configuration...`);
    await this.copyTailwindConfig(projectPath);
    console.log(`✅ Tailwind config copied in ${Date.now() - tailwindStartTime}ms`);
    
    console.log(`🏗️  [${new Date().toISOString()}] Project generation completed for ${projectId}`);
    return projectPath;
  }

  private async copyTemplate(targetPath: string): Promise<void> {
    await fs.promises.mkdir(targetPath, { recursive: true });
    await this.copyDir(this.templatePath, targetPath);
  }

  private async copyTailwindConfig(targetPath: string): Promise<void> {
    // Copy the custom tailwind configuration from main project
    const configSourcePath = path.join(process.cwd(), 'src', 'config', 'tailwind.custom.config.js');
    const configTargetPath = path.join(targetPath, 'tailwind.config.js');
    
    try {
      const configContent = await fs.promises.readFile(configSourcePath, 'utf-8');
      // Adapt config for standalone deployment
      const adaptedConfig = this.adaptTailwindConfigForDeploy(configContent);
      await fs.promises.writeFile(configTargetPath, adaptedConfig);
    } catch (error) {
      console.warn('Could not copy tailwind config, using default:', error);
    }
  }

  private adaptTailwindConfigForDeploy(configContent: string): string {
    // Convert ES module to CommonJS and remove problematic plugins
    let adaptedConfig = configContent;
    
    // Replace module.exports with proper structure
    adaptedConfig = adaptedConfig.replace(
      'module.exports = {',
      '/** @type {import(\'tailwindcss\').Config} */\nmodule.exports = {'
    );
    
    // Remove plugin dependencies that might not be available in deployment
    adaptedConfig = adaptedConfig.replace(
      /require\(["']tailwindcss-animate["']\)/g,
      '// require("tailwindcss-animate") // Disabled for deployment'
    );
    
    adaptedConfig = adaptedConfig.replace(
      /require\(["']@tailwindcss\/typography["']\)/g,
      '// require("@tailwindcss/typography") // Disabled for deployment'
    );
    
    // Simplify plugins array to avoid issues
    adaptedConfig = adaptedConfig.replace(
      /plugins:\s*\[[\s\S]*?\]/,
      'plugins: []'
    );
    
    return adaptedConfig;
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
    
    // Collect all unique component types and generate imports
    const neededComponents = new Set<string>();
    for (const blockId of sitemap) {
      const block = blocks[blockId];
      neededComponents.add(block.subtype);
    }
    
    // Add imports for all needed components (using original names)
    for (const componentName of neededComponents) {
      imports.push(`import ${componentName} from './components/${componentName}';`);
    }
    
    // Generate component instances with proper props
    for (const blockId of sitemap) {
      const block = blocks[blockId];
      const content = block_contents[block.content];
      const componentName = block.subtype; // Use original component name
      
      // Generate props object as a JavaScript object literal
      const propsStr = this.generateComponentProps(block.subtype, content);
      components.push(`      <${componentName} ${propsStr} />`);
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

  private getAdaptedComponentName(originalName: string): string {
    // Keep original component names - no renaming
    return originalName;
  }

  private async copyComponentsWithDependencies(projectPath: string, landingPageData: LandingPageData): Promise<void> {
    const componentsDir = path.join(projectPath, 'src', 'components');
    await fs.promises.mkdir(componentsDir, { recursive: true });

    // Copy the entire common components directory first
    const commonSourcePath = path.join(process.cwd(), 'src', 'components', 'common');
    const commonTargetPath = path.join(componentsDir, 'common');
    await this.copyDir(commonSourcePath, commonTargetPath);

    // Copy utils if exists
    const utilsSourcePath = path.join(process.cwd(), 'src', 'components', 'utils');
    const utilsTargetPath = path.join(componentsDir, 'utils');
    try {
      await this.copyDir(utilsSourcePath, utilsTargetPath);
    } catch (error) {
      console.warn('Utils directory not found, skipping:', error);
    }

    // Get all needed landing page components
    const landingPageSourcePath = path.join(process.cwd(), 'src', 'components', 'landing-page');
    const { sitemap, blocks } = landingPageData;

    // Collect all unique component types needed
    const neededComponents = new Set<string>();
    for (const blockId of sitemap) {
      const block = blocks[blockId];
      neededComponents.add(block.subtype);
    }

    // Scan all components for external dependencies
    const externalDeps = await this.scanExternalDependencies(componentsDir, neededComponents, landingPageSourcePath);
    
    // Create global types based on discovered dependencies
    await this.createGlobalTypes(projectPath, externalDeps);

    // Copy and adapt each needed component
    for (const componentName of neededComponents) {
      const sourceFile = path.join(landingPageSourcePath, `${componentName}.tsx`);
      
      try {
        let content = await fs.promises.readFile(sourceFile, 'utf-8');
        
        // Apply universal adaptations for standalone deployment only to landing page components
        content = this.adaptComponentForDeployment(content, componentName);
        
        // Write the adapted component with original name
        const targetFile = path.join(componentsDir, `${componentName}.tsx`);
        await fs.promises.writeFile(targetFile, content);
        
      } catch (error) {
        console.warn(`Could not copy component ${componentName}:`, error);
      }
    }
  }

  // Configuration for external library mappings
  private readonly EXTERNAL_LIB_MAPPINGS = {
    'react-icons': {
      pattern: /^react-icons\/(\w+)$/,
      globalType: 'React.ComponentType<any>',
      mockPattern: 'window.{iconName}',
      extractExports: (importPath: string, importedItems: string[]) => {
        const match = importPath.match(this.EXTERNAL_LIB_MAPPINGS['react-icons'].pattern);
        const category = match ? match[1] : 'rx';
        return importedItems.map(item => ({ name: item, category, type: 'icon' }));
      }
    },
    'framer-motion': {
      exports: ['motion', 'AnimatePresence'],
      globalType: 'any',
      mockPattern: 'window.{exportName}',
      extractExports: (importPath: string, importedItems: string[]) => {
        return importedItems.map(item => ({ name: item, type: 'motion' }));
      }
    },
    'colord': {
      exports: ['colord', 'extend'],
      globalType: 'any',
      mockPattern: 'window.{exportName}',
      extractExports: (importPath: string, importedItems: string[]) => {
        return importedItems.map(item => ({ name: item, type: 'color' }));
      }
    }
  };

  private async scanExternalDependencies(componentsDir: string, neededComponents: Set<string>, landingPageSourcePath: string): Promise<Map<string, any[]>> {
    const externalDeps = new Map<string, any[]>();
    
    // Scan landing page components
    for (const componentName of neededComponents) {
      const sourceFile = path.join(landingPageSourcePath, `${componentName}.tsx`);
      try {
        const content = await fs.promises.readFile(sourceFile, 'utf-8');
        this.extractDependenciesFromContent(content, externalDeps);
      } catch (error) {
        console.warn(`Could not scan component ${componentName}:`, error);
      }
    }

    // Scan common components
    try {
      const commonPath = path.join(process.cwd(), 'src', 'components', 'common');
      const commonFiles = await fs.promises.readdir(commonPath);
      
      for (const file of commonFiles) {
        if (file.endsWith('.tsx')) {
          const filePath = path.join(commonPath, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          this.extractDependenciesFromContent(content, externalDeps);
        }
      }
    } catch (error) {
      console.warn('Could not scan common components:', error);
    }

    return externalDeps;
  }

  private extractDependenciesFromContent(content: string, externalDeps: Map<string, any[]>): void {
    // Extract import statements
    const importRegex = /import\s+(?:{\s*([^}]+)\s*}|(\w+))\s+from\s+['"]([^'"]+)['"];?/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [, namedImports, defaultImport, importPath] = match;
      
      // Check if this is an external library we need to handle
      for (const [libName, config] of Object.entries(this.EXTERNAL_LIB_MAPPINGS)) {
        if (importPath.startsWith(libName) || (config.pattern && config.pattern.test(importPath))) {
          let importedItems: string[] = [];
          
          if (namedImports) {
            importedItems = namedImports.split(',').map(item => item.trim());
          } else if (defaultImport) {
            importedItems = [defaultImport];
          }

          if (importedItems.length > 0) {
            const exports = config.extractExports(importPath, importedItems);
            
            if (!externalDeps.has(libName)) {
              externalDeps.set(libName, []);
            }
            externalDeps.get(libName)!.push(...exports);
          }
          break;
        }
      }
    }
  }

  private async createGlobalTypes(projectPath: string, externalDeps: Map<string, any[]>): Promise<void> {
    let globalTypesContent = `// Auto-generated global type definitions for external dependencies\n\n`;

    // Generate module declarations based on discovered dependencies
    for (const [libName, exports] of externalDeps.entries()) {
      const config = this.EXTERNAL_LIB_MAPPINGS[libName];
      if (!config) continue;

      // Generate module declarations
      if (libName === 'react-icons') {
        // Group icons by category
        const iconCategories = new Map<string, string[]>();
        for (const exp of exports) {
          if (exp.type === 'icon') {
            const category = exp.category || 'rx';
            if (!iconCategories.has(category)) {
              iconCategories.set(category, []);
            }
            iconCategories.get(category)!.push(exp.name);
          }
        }

        // Generate declarations for each category
        for (const [category, icons] of iconCategories.entries()) {
          globalTypesContent += `declare module 'react-icons/${category}' {\n`;
          for (const icon of [...new Set(icons)]) {
            globalTypesContent += `  export const ${icon}: ${config.globalType};\n`;
          }
          globalTypesContent += `}\n\n`;
        }
      } else {
        // Generate standard module declaration
        globalTypesContent += `declare module '${libName}' {\n`;
        const uniqueExports = [...new Set(exports.map(e => e.name))];
        for (const exportName of uniqueExports) {
          globalTypesContent += `  export const ${exportName}: ${config.globalType};\n`;
        }
        globalTypesContent += `}\n\n`;
      }

      // Generate global variable declarations
      globalTypesContent += `// Global variables for ${libName}\n`;
      const uniqueExports = [...new Set(exports.map(e => e.name))];
      for (const exportName of uniqueExports) {
        globalTypesContent += `declare const ${exportName}: ${config.globalType};\n`;
      }
      globalTypesContent += `\n`;
    }

    // Add general fallback declarations
    globalTypesContent += `// General fallback declarations\n`;
    globalTypesContent += `declare global {\n`;
    globalTypesContent += `  interface Window {\n`;
    globalTypesContent += `    [key: string]: any;\n`;
    globalTypesContent += `  }\n`;
    globalTypesContent += `}\n\n`;

    globalTypesContent += `export {};\n`;

    const globalTypesPath = path.join(projectPath, 'src', 'global.d.ts');
    await fs.promises.writeFile(globalTypesPath, globalTypesContent);
  }

  private adaptComponentForDeployment(content: string, componentName: string): string {
    // Universal adaptations for TypeScript compilation
    
    // 1. Fix import paths to use local common components
    content = content.replace(
      /import\s+{\s*([^}]+)\s*}\s+from\s+["']\.\.\/(common|utils)["'];?/g,
      'import { $1 } from "./$2";'
    );
    
    content = content.replace(
      /import\s+type\s+{\s*([^}]+)\s*}\s+from\s+["']\.\.\/(common|utils)["'];?/g,
      'import type { $1 } from "./$2";'
    );

    // 2. Collect all React Icons used in the component (only actual icon components in JSX)
    const reactIconsUsed = new Set<string>();
    
    // Look for React Icons specifically in JSX usage (e.g. <RxChevronDown />)
    const jsxIconMatches = content.match(/<(Rx\w+|Bi\w+|Io\w+|Cg\w+|Fa\w+|Fi\w+|Hi\w+|Md\w+|Ti\w+|Bs\w+|Ai\w+|Go\w+|Gr\w+|Im\w+|Si\w+|Tb\w+|Vsc\w+|Wi\w+)\s*[/>]/g);
    if (jsxIconMatches) {
      jsxIconMatches.forEach(match => {
        const iconMatch = match.match(/<(\w+)/);
        if (iconMatch) {
          reactIconsUsed.add(iconMatch[1]);
        }
      });
    }
    
    // Also look for icons used as variables (e.g. iconRight: <RxChevronRight />)
    const iconPropMatches = content.match(/:\s*<(Rx\w+|Bi\w+|Io\w+|Cg\w+|Fa\w+|Fi\w+|Hi\w+|Md\w+|Ti\w+|Bs\w+|Ai\w+|Go\w+|Gr\w+|Im\w+|Si\w+|Tb\w+|Vsc\w+|Wi\w+)\s*[/>]/g);
    if (iconPropMatches) {
      iconPropMatches.forEach(match => {
        const iconMatch = match.match(/<(\w+)/);
        if (iconMatch) {
          reactIconsUsed.add(iconMatch[1]);
        }
      });
    }

    // 3. Check if Framer Motion is used
    const usesFramerMotion = content.includes('motion.') || content.includes('AnimatePresence');

    // 4. Group React Icons by category and add missing imports
    const iconCategories = {
      'rx': [] as string[],
      'bi': [] as string[],
      'io5': [] as string[],
      'cg': [] as string[],
      'fa': [] as string[],
      'fi': [] as string[],
      'hi': [] as string[],
      'md': [] as string[],
      'ti': [] as string[],
      'bs': [] as string[],
      'ai': [] as string[],
      'go': [] as string[],
      'gr': [] as string[],
      'im': [] as string[],
      'si': [] as string[],
      'tb': [] as string[],
      'vsc': [] as string[],
      'wi': [] as string[]
    };

    // Group icons by category
    reactIconsUsed.forEach(icon => {
      const prefix = icon.substring(0, 2).toLowerCase();
      if (iconCategories[prefix]) {
        iconCategories[prefix].push(icon);
      } else if (icon.startsWith('Io')) {
        iconCategories['io5'].push(icon);
      } else {
        // Default to rx for unknown prefixes
        iconCategories['rx'].push(icon);
      }
    });

    // 5. Add missing imports at the top of the file
    let importsToAdd = '';
    
    // Add Framer Motion import if needed and not present
    if (usesFramerMotion && !content.includes('from "framer-motion"')) {
      const motionComponents = [];
      if (content.includes('motion.')) motionComponents.push('motion');
      if (content.includes('AnimatePresence')) motionComponents.push('AnimatePresence');
      if (motionComponents.length > 0) {
        importsToAdd += `import { ${motionComponents.join(', ')} } from "framer-motion";\n`;
      }
    }

    // Add React Icons imports if needed and not present
    Object.entries(iconCategories).forEach(([category, icons]) => {
      if (icons.length > 0) {
        const importPath = `react-icons/${category}`;
        // Check if this category is already imported
        if (!content.includes(`from "${importPath}"`)) {
          importsToAdd += `import { ${icons.join(', ')} } from "${importPath}";\n`;
        }
      }
    });

    // 6. Add the missing imports after existing imports
    if (importsToAdd) {
      // Find the last import statement
      const importMatches = content.match(/^import[^;]+;/gm);
      if (importMatches) {
        const lastImportIndex = content.lastIndexOf(importMatches[importMatches.length - 1]);
        const lastImportEnd = lastImportIndex + importMatches[importMatches.length - 1].length;
        content = content.slice(0, lastImportEnd) + '\n' + importsToAdd + content.slice(lastImportEnd);
      } else {
        // No existing imports, add at the beginning after "use client" if present
        if (content.includes('"use client"')) {
          content = content.replace('"use client";\n', '"use client";\n\n' + importsToAdd);
        } else {
          content = importsToAdd + '\n' + content;
        }
      }
    }

    // 7. Remove the original named export line if it exists
    content = content.replace(new RegExp(`export\\s+{\\s*${componentName}\\s*}`, 'g'), '');
    
    // 8. Add default export if not already present
    if (!content.includes('export default')) {
      content += `\n\nexport default ${componentName};`;
    }

    return content;
  }

  private generateComponentProps(componentName: string, content: LandingPageContent): string {
    // Generic prop generation based on component type
    switch (componentName) {
      case 'Navbar1':
        return this.generateNavbarProps(content);
      case 'Layout1':
        return this.generateLayoutProps(content);
      default:
        // For unknown components, try to pass all content as props
        // This is a fallback for future components
        return this.generateGenericProps(content);
    }
  }

  private generateGenericProps(content: LandingPageContent): string {
    // Generic approach: convert all content properties to React props
    const props: string[] = [];
    
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'string') {
        props.push(`${key}="${this.escapeString(value)}"`);
      } else if (typeof value === 'object' && value !== null) {
        props.push(`${key}={${JSON.stringify(value)}}`);
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        props.push(`${key}={${value}}`);
      }
    }
    
    return props.join(' ');
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private generateNavbarProps(content: LandingPageContent): string {
    // Handle both old and new data formats
    if (content.logo && typeof content.logo === 'object') {
      // New format
      const logo = content.logo;
      const navLinks = content.navLinks || [];
      const buttons = content.buttons || [];
      
      return `logo={${JSON.stringify(logo)}} navLinks={${JSON.stringify(navLinks)}} buttons={${JSON.stringify(buttons)}}`;
    } else {
      // Old format - convert to new format
      const convertedData = {
        logo: {
          url: "#",
          src: content.logo_src || '/logo.png',
          alt: "Logo"
        },
        navLinks: [],
        buttons: [{
          title: content.button || 'Get Started',
          variant: "secondary",
          size: "sm"
        }]
      };
      
      return `logo={${JSON.stringify(convertedData.logo)}} navLinks={${JSON.stringify(convertedData.navLinks)}} buttons={${JSON.stringify(convertedData.buttons)}}`;
    }
  }

  private generateLayoutProps(content: LandingPageContent): string {
    // Handle both old and new data formats
    if (content.heading && content.tagline) {
      // New format
      const buttons = content.buttons || [];
      const image = content.image || { src: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg", alt: "Hero image" };
      
      return `tagline="${this.escapeString(content.tagline)}" heading="${this.escapeString(content.heading)}" description="${this.escapeString(content.description)}" buttons={${JSON.stringify(buttons)}} image={${JSON.stringify(image)}}`;
    } else {
      // Old format - convert to new format
      const convertedData = {
        tagline: "AI-Powered",
        heading: content.title || 'Build Beautiful Landing Pages',
        description: content.desc || content.description || 'Create stunning landing pages with AI assistance.',
        buttons: [
          { title: content.button1 || 'Get Started', variant: "secondary" },
          { title: content.button2 || 'Learn More', variant: "link", size: "link" }
        ],
        image: {
          src: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
          alt: "Hero image"
        }
      };
      
      return `tagline="${this.escapeString(convertedData.tagline)}" heading="${this.escapeString(convertedData.heading)}" description="${this.escapeString(convertedData.description)}" buttons={${JSON.stringify(convertedData.buttons)}} image={${JSON.stringify(convertedData.image)}}`;
    }
  }

  async buildProject(projectPath: string): Promise<string> {
    console.log(`🔨 [${new Date().toISOString()}] Starting build process for ${path.basename(projectPath)}`);
    const distPath = path.join(projectPath, 'dist');
    
    try {
      // 检查并使用共享的node_modules缓存
      const sharedSetupStartTime = Date.now();
      console.log(`📦 [${new Date().toISOString()}] Setting up shared dependencies...`);
      await this.ensureSharedNodeModules();
      await this.linkSharedNodeModules(projectPath);
      console.log(`✅ Dependencies setup completed in ${Date.now() - sharedSetupStartTime}ms`);
      
      // Build the project using Vite
      const viteStartTime = Date.now();
      console.log(`⚡ [${new Date().toISOString()}] Running Vite build...`);
      await this.runCommand('npm run build', projectPath);
      console.log(`✅ Vite build completed in ${Date.now() - viteStartTime}ms`);
      
      console.log(`🔨 [${new Date().toISOString()}] Build process completed for ${path.basename(projectPath)}`);
      return distPath;
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Build failed for ${path.basename(projectPath)}:`, error);
      // Fallback to generating a simple HTML file if build fails
      const fallbackStartTime = Date.now();
      console.log(`🔄 [${new Date().toISOString()}] Falling back to static HTML generation...`);
      const result = await this.generateFallbackHtml(projectPath);
      console.log(`✅ Fallback HTML generated in ${Date.now() - fallbackStartTime}ms`);
      return result;
    }
  }

  private async ensureSharedNodeModules(): Promise<void> {
    const sharedNodeModulesPath = path.join(process.cwd(), 'template', 'node_modules');
    const templatePackageJsonPath = path.join(process.cwd(), 'template', 'package.json');
    
    // 检查共享的node_modules是否存在且是最新的
    const hasSharedNodeModules = await this.directoryExists(sharedNodeModulesPath);
    
    if (!hasSharedNodeModules) {
      console.log('Installing shared dependencies for faster deployments...');
      // 在template目录中安装依赖，这样可以被所有项目共享
      await this.runCommand('npm install --prefer-offline --no-audit --no-fund', path.join(process.cwd(), 'template'));
      console.log('Shared dependencies installed successfully');
    } else {
      console.log('Using existing shared dependencies cache');
    }
  }

  private async linkSharedNodeModules(projectPath: string): Promise<void> {
    const projectNodeModulesPath = path.join(projectPath, 'node_modules');
    const sharedNodeModulesPath = path.join(process.cwd(), 'template', 'node_modules');
    
    // 检查项目是否已经有node_modules链接
    const hasProjectNodeModules = await this.directoryExists(projectNodeModulesPath);
    
    if (!hasProjectNodeModules) {
      console.log('Setting up node_modules for faster build...');
      
      try {
        if (process.platform === 'win32') {
          // Windows: 使用robocopy命令，比fs.copyFile更稳定
          console.log('Using robocopy for faster node_modules setup...');
          await this.runCommand(`robocopy "${sharedNodeModulesPath}" "${projectNodeModulesPath}" /E /NFL /NDL /NJH /NJS /nc /ns /np`, process.cwd());
        } else {
          // Unix/Linux/Mac: 使用符号链接
          await fs.promises.symlink(sharedNodeModulesPath, projectNodeModulesPath);
        }
        
        console.log('Node modules setup completed successfully');
      } catch (error) {
        console.log('Shared dependencies setup failed, installing fresh dependencies...');
        // 降级到直接安装，但使用缓存加速
        await this.runCommand('npm install --prefer-offline --no-audit --no-fund --cache-min 3600', projectPath);
      }
    }
  }

  private async runCommand(command: string, cwd: string): Promise<void> {
    const { spawn } = require('child_process');
    const isWindows = process.platform === 'win32';
    
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const actualCmd = isWindows ? 'cmd' : cmd;
      const actualArgs = isWindows ? ['/c', command] : args;
      
      const child = spawn(actualCmd, actualArgs, {
        cwd,
        stdio: 'pipe',
        shell: false
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        // 特殊处理robocopy的退出码
        if (command.startsWith('robocopy')) {
          // robocopy退出码: 0-7是成功，8+是错误
          if (code !== null && code >= 0 && code <= 7) {
            resolve();
          } else {
            reject(new Error(`Robocopy failed with code ${code}: ${stderr}`));
          }
        } else {
          // 普通命令处理
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Command failed with code ${code}: ${stderr}`));
          }
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async generateFallbackHtml(projectPath: string): Promise<string> {
    // Fallback to simple HTML generation if Vite build fails
    const distPath = path.join(projectPath, 'dist');
    await fs.promises.mkdir(distPath, { recursive: true });
    
    const appPath = path.join(projectPath, 'src', 'App.tsx');
    const appContent = await fs.promises.readFile(appPath, 'utf-8');
    
    const indexHtml = await this.generateStaticHtml(projectPath, appContent);
    await fs.promises.writeFile(path.join(distPath, 'index.html'), indexHtml);
    
    return distPath;
  }

  private async generateStaticHtml(projectPath: string, appContent: string): Promise<string> {
    // Extract component usage from App.tsx to render static HTML
    const componentsDir = path.join(projectPath, 'src', 'components');
    
    // Get custom tailwind config for CDN usage
    const { getTailwindConfigForCDN } = require('../config/tailwind.utils.js');
    const tailwindConfig = getTailwindConfigForCDN();
    
    // Read the global types to understand what dependencies we need to mock
    const globalTypesPath = path.join(projectPath, 'src', 'global.d.ts');
    let externalDeps = new Map<string, any[]>();
    
    try {
      const globalTypesContent = await fs.promises.readFile(globalTypesPath, 'utf-8');
      externalDeps = this.parseGlobalTypesForDependencies(globalTypesContent);
    } catch (error) {
      console.warn('Could not read global types, using minimal mocks');
    }
    
    // Generate component definitions by processing the actual cloned files
    const componentDefinitions = await this.getComponentDefinitions(componentsDir);
    
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
    <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.umd.js"></script>
    <script>
        // Apply custom Tailwind configuration
        tailwind.config = ${tailwindConfig};
        
        // Generate mocks based on discovered dependencies
        ${this.generateDynamicMocks(externalDeps)}
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        // Import global mocks
        ${this.generateGlobalImports(externalDeps)}
        
        // Component definitions (cloned from actual source files)
        ${componentDefinitions}
        
        // App component
        ${await this.getAppDefinition(appContent)}
        
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
  }

  private parseGlobalTypesForDependencies(globalTypesContent: string): Map<string, any[]> {
    const externalDeps = new Map<string, any[]>();
    
    // Parse the global types content to extract declared constants
    const constRegex = /declare const (\w+): ([^;]+);/g;
    let match;
    
    while ((match = constRegex.exec(globalTypesContent)) !== null) {
      const [, constName, constType] = match;
      
      // Determine which library this belongs to based on our mapping
      for (const [libName, config] of Object.entries(this.EXTERNAL_LIB_MAPPINGS)) {
        if (libName === 'react-icons' && constName.startsWith('Rx')) {
          if (!externalDeps.has(libName)) {
            externalDeps.set(libName, []);
          }
          externalDeps.get(libName)!.push({ name: constName, type: 'icon' });
        } else if (libName === 'framer-motion' && config.exports?.includes(constName)) {
          if (!externalDeps.has(libName)) {
            externalDeps.set(libName, []);
          }
          externalDeps.get(libName)!.push({ name: constName, type: 'motion' });
        } else if (libName === 'colord' && config.exports?.includes(constName)) {
          if (!externalDeps.has(libName)) {
            externalDeps.set(libName, []);
          }
          externalDeps.get(libName)!.push({ name: constName, type: 'color' });
        }
      }
    }
    
    return externalDeps;
  }

  private generateDynamicMocks(externalDeps: Map<string, any[]>): string {
    let mockCode = '';
    
    for (const [libName, exports] of externalDeps.entries()) {
      const config = this.EXTERNAL_LIB_MAPPINGS[libName];
      if (!config) continue;
      
      if (libName === 'react-icons') {
        // Generate icon mocks
        for (const exp of exports) {
          if (exp.type === 'icon') {
            mockCode += `
        window.${exp.name} = () => React.createElement('svg', { 
          className: 'w-4 h-4', 
          fill: 'none', 
          stroke: 'currentColor', 
          viewBox: '0 0 24 24' 
        }, React.createElement('path', { 
          strokeLinecap: 'round', 
          strokeLinejoin: 'round', 
          strokeWidth: 2, 
          d: 'M${exp.name.includes('Down') ? '19 9l-7 7-7-7' : '9 5l7 7-7 7'}' 
        }));`;
          }
        }
      } else if (libName === 'framer-motion') {
        // Generate motion mocks
        mockCode += `
        window.motion = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string') {
              return function(props) {
                const { animate, variants, transition, initial, exit, ...restProps } = props || {};
                return React.createElement(prop, restProps);
              };
            }
            return target[prop];
          }
        });
        
        window.AnimatePresence = function({ children }) {
          return children;
        };`;
      } else if (libName === 'colord') {
        // Generate color utility mocks
        for (const exp of exports) {
          if (exp.name === 'colord') {
            mockCode += `
        window.colord = function(color) {
          return {
            toHex: () => color,
            toRgb: () => ({ r: 0, g: 0, b: 0 }),
            alpha: (a) => window.colord(color)
          };
        };`;
          } else {
            mockCode += `
        window.${exp.name} = function() { return {}; };`;
          }
        }
      }
    }
    
    return mockCode;
  }

  private generateGlobalImports(externalDeps: Map<string, any[]>): string {
    let importCode = '';
    
    for (const [libName, exports] of externalDeps.entries()) {
      for (const exp of exports) {
        importCode += `const ${exp.name} = window.${exp.name};\n        `;
      }
    }
    
    return importCode;
  }

  private async getComponentDefinitions(componentsDir: string): Promise<string> {
    let definitions = '';
    
    try {
      // Get all TypeScript component files (excluding directories)
      const files = await fs.promises.readdir(componentsDir);
      
      for (const file of files) {
        if (file.endsWith('.tsx') && file !== 'index.tsx') {
          const componentPath = path.join(componentsDir, file);
          let content = await fs.promises.readFile(componentPath, 'utf-8');
          
          // Clean up TypeScript syntax for Babel browser compilation
          content = this.cleanComponentForBrowser(content);
          definitions += content + '\n\n';
        }
      }
      
    } catch (error) {
      console.warn('Error reading component definitions:', error);
    }
    
    return definitions;
  }

  private cleanComponentForBrowser(content: string): string {
    // Step 1: Remove all imports first
    content = content.replace(/import[^;]+;/g, '');
    content = content.replace(/"use client";/g, '');
    
    // Step 2: Remove all TypeScript type definitions and interfaces completely
    content = content.replace(/interface\s+\w+\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs, '');
    content = content.replace(/type\s+\w+\s*=\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\};?/gs, '');
    content = content.replace(/type\s+\w+\s*=[^;]+;/g, '');
    content = content.replace(/export\s+type\s+[^;=]+[=;][^;]*;/g, '');
    
    // Step 3: Clean function parameter type annotations
    content = content.replace(/\(\s*\w+\s*:\s*[^)]+\)/g, (match) => {
      // Extract parameter names only, remove types
      const paramMatch = match.match(/\(\s*(\w+)/);
      return paramMatch ? `(${paramMatch[1]})` : '()';
    });
    
    // Step 4: Remove React.ComponentPropsWithoutRef and complex type annotations
    content = content.replace(/React\.ComponentPropsWithoutRef<[^>]+>\s*&\s*/g, '');
    content = content.replace(/Partial<\w+>/g, '{}');
    content = content.replace(/:\s*\w+Props/g, '');
    
    // Step 5: Remove variable type annotations (: Type)
    content = content.replace(/:\s*[\w\[\]<>|&\s]+(?=\s*[=,\)])/g, '');
    content = content.replace(/:\s*\{[^}]*\}/g, '');
    content = content.replace(/:\s*[\w\[\]]+\[\]/g, '');
    
    // Step 6: Remove JSX type assertions and as keyword
    content = content.replace(/as\s+\w+/g, '');
    content = content.replace(/<[^>]+>/g, (match) => {
      // Keep JSX tags, remove type arguments like <T>
      if (match.match(/^<[A-Z]\w*/) || match.match(/^<\/[A-Z]\w*/)) {
        return match; // Keep JSX
      }
      return ''; // Remove type arguments
    });
    
    // Step 7: Fix object/array type syntax issues
    content = content.replace(/\w+\[\]/g, (match) => match.replace('[]', ''));
    content = content.replace(/\{\s*\[key:\s*string\]\s*:\s*any\s*\}/g, '{}');
    
    // Step 8: Remove export keywords but preserve const declarations
    content = content.replace(/export\s+const/g, 'const');
    content = content.replace(/export\s+function/g, 'function');
    content = content.replace(/export\s+default/g, '');
    content = content.replace(/export\s+\{[^}]*\}/g, '');
    
    // Step 9: Clean up broken object literals and syntax
    content = content.replace(/\{\s*,/g, '{');
    content = content.replace(/,\s*\}/g, '}');
    content = content.replace(/;\s*;/g, ';');
    
    // Step 10: Remove standalone type-only lines
    content = content.replace(/^\s*\w+\s*;\s*$/gm, '');
    content = content.replace(/^\s*\};\s*$/gm, '');
    
    // Step 11: Clean up excessive whitespace and empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/^\s*$\n/gm, '');
    
    return content;
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
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