import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface TransformRule {
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
  description: string;
}

interface TransformConfig {
  imports: string[];
  rules: TransformRule[];
}

/**
 * Component Transform Engine
 * Automatically converts components to use editable wrapper components
 */
export class ComponentTransformer {
  private config: TransformConfig;

  constructor() {
    this.config = {
      imports: [
        `import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from '../editable';`
      ],
      rules: [
        // Transform simple text content in JSX elements
        {
          pattern: /<(h[1-6]|p|span|div)([^>]*?)>\s*\{([^}]+)\}\s*<\/\1>/g,
          replacement: (match, tag, attrs, varName) => {
            return `<EditableText as="${tag}" path="${varName}" value={${varName}}${attrs}>{${varName}}</EditableText>`;
          },
          description: 'Convert text elements to EditableText'
        },

        // Transform Button components with text content
        {
          pattern: /<Button\s+([^>]*?)>\s*\{([^}]+)\}\s*<\/Button>/g,
          replacement: (match, attrs, textVar) => {
            // 提取button变量名，通常是button.title，需要找到数组名
            const buttonVar = textVar.replace('.title', '');
            const hasKey = attrs.includes('key=');
            const keyAttr = hasKey ? '' : ' key={index}';
            // 使用buttons作为路径，因为按钮通常在buttons数组中
            return `<EditableButton button={${buttonVar}} path="buttons" index={index}${keyAttr} ${attrs.trim()} />`;
          },
          description: 'Convert Button components to EditableButton'
        },
        
        // Transform img tags
        {
          pattern: /<img\s+([^>]*?)src=\{([^}]+)\}([^>]*?)(?:alt=\{([^}]+)\})?([^>]*?)\/?>(?:<\/img>)?/g,
          replacement: (match, beforeSrc, srcVar, afterSrc, altVar, afterAlt) => {
            const altPart = altVar ? ` alt={${altVar}}` : '';
            const pathVar = srcVar.includes('.') ? srcVar.split('.').slice(0, -1).join('.') : srcVar;
            return `<EditableImage src={${srcVar}} path="${pathVar}"${altPart}${beforeSrc}${afterSrc}${afterAlt} />`;
          },
          description: 'Convert img tags to EditableImage'
        },
        
        // Transform anchor tags with href and text content
        {
          pattern: /<a\s+([^>]*?)href=\{([^}]+)\}([^>]*?)>\s*\{([^}]+)\}\s*<\/a>/g,
          replacement: (match, beforeHref, hrefVar, afterHref, textVar) => {
            // 创建基于数组的路径，包含index
            const baseArrayName = hrefVar.includes('.') ? hrefVar.split('.')[0] : 'navLinks';
            const hrefPath = `${baseArrayName}.\${index}.url`;
            const textPath = `${baseArrayName}.\${index}.title`;
            const attrs = (beforeHref + afterHref).trim();
            return `<EditableLink href={${hrefVar}} path={\`${hrefPath}\`} textPath={\`${textPath}\`} text={${textVar}} ${attrs}>{${textVar}}</EditableLink>`;
          },
          description: 'Convert anchor tags with text to EditableLink'
        },
        
        // Transform SubMenu component definition to include parentIndex
        {
          pattern: /const SubMenu = \(\{ navLink, isMobile \}: \{ navLink: NavLink; isMobile: boolean \}\)/g,
          replacement: () => {
            return `const SubMenu = ({ navLink, parentIndex, isMobile }: { navLink: NavLink; parentIndex: number; isMobile: boolean })`;
          },
          description: 'Update SubMenu type definition to include parentIndex'
        },
        
        // Transform SubMenu calls to include parentIndex
        {
          pattern: /<SubMenu\s+key=\{index\}\s+navLink=\{navLink\}\s+isMobile=\{isMobile\}\s*\/>/g,
          replacement: (match) => {
            return `<SubMenu key={index} navLink={navLink} parentIndex={index} isMobile={isMobile} />`;
          },
          description: 'Add parentIndex to SubMenu calls'
        },
        
        // Transform dropdown menu titles (EditableText in SubMenu context)
        {
          pattern: /<EditableText\s+([^>]*?)path="navLink\.title"\s+([^>]*?)>\s*\{([^}]+)\}\s*<\/EditableText>/g,
          replacement: (match, beforeAttrs, afterAttrs, textVar) => {
            // 这是SubMenu中的dropdown title，转换为EditableDropdownTitle，使用正确的路径
            const allAttrs = (beforeAttrs + afterAttrs).trim();
            return `<EditableDropdownTitle title={${textVar}} path={\`navLinks.\${parentIndex}.title\`} ${allAttrs}>{${textVar}}</EditableDropdownTitle>`;
          },
          description: 'Convert dropdown menu titles to EditableDropdownTitle'
        },
        
        // Fix existing EditableLink paths that use navLink instead of navLinks
        {
          pattern: /<EditableLink\s+([^>]*?)path=\{`navLink\.(\$\{[^}]+\})\.([^`]+)`\}\s+([^>]*?)>/g,
          replacement: (match, beforePath, indexPart, property, afterPath) => {
            const beforeAttrs = beforePath.trim();
            const afterAttrs = afterPath.trim();
            return `<EditableLink ${beforeAttrs}path={\`navLinks.${indexPart}.${property}\`} ${afterAttrs}>`;
          },
          description: 'Fix EditableLink paths from navLink to navLinks'
        },
        
        // Fix existing EditableLink textPath that use navLink instead of navLinks  
        {
          pattern: /textPath=\{`navLink\.(\$\{[^}]+\})\.([^`]+)`\}/g,
          replacement: (match, indexPart, property) => {
            return `textPath={\`navLinks.${indexPart}.${property}\`}`;
          },
          description: 'Fix EditableLink textPath from navLink to navLinks'
        },
        
        // Fix SubMenu sublinks to use correct nested path
        {
          pattern: /(\{navLink\.subMenuLinks\?\.map\([^}]+\) => \(\s*<EditableLink[^>]+)path=\{`navLinks\.\$\{index\}\.url`\}([^>]+)textPath=\{`navLinks\.\$\{index\}\.title`\}/g,
          replacement: (match, beforePath, middle) => {
            return `${beforePath}path={\`navLinks.\${parentIndex}.subMenuLinks.\${index}.url\`}${middle}textPath={\`navLinks.\${parentIndex}.subMenuLinks.\${index}.title\`}`;
          },
          description: 'Fix SubMenu sublinks to use correct nested path'
        },
        
        
        // Replace SubMenu and EditableLink with unified EditableMenuItem  
        {
          pattern: /<EditableArray path="navLinks" as="fragment">\{navLinks\.map\((navLink, index)\s*=>\s*navLink\.subMenuLinks && navLink\.subMenuLinks\.length > 0 \?\s*\(\s*<SubMenu[^>]*\/>\s*\)\s*:\s*\(\s*<EditableLink[^>]*>[^<]*<\/EditableLink>\s*\),?\s*\)\}<\/EditableArray>/g,
          replacement: (match) => {
            return `<EditableArray path="navLinks" as="fragment">{navLinks.map((navLink, index) => (
              <EditableMenuItem 
                key={index} 
                navLink={navLink} 
                index={index} 
                isMobile={isMobile}
                className="block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2"
              />
            ))}</EditableArray>`;
          },
          description: 'Replace SubMenu and EditableLink with unified EditableMenuItem'
        },

        // Transform map operations for arrays (keep original content, just wrap with EditableArray)
        {
          pattern: /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*map\s*\(\s*\(([^,)]+)(?:,\s*([^)]+))?\)\s*=>\s*([\s\S]*?)\)\s*\}/g,
          replacement: (match, arrayVar, itemVar, indexVar, content) => {
            const indexParam = indexVar || 'index';
            // 使用fragment来避免破坏原有布局
            return `<EditableArray path="${arrayVar}" as="fragment">{${arrayVar}.map((${itemVar}, ${indexParam}) => ${content})}</EditableArray>`;
          },
          description: 'Wrap array mappings with EditableArray (layout-preserving)'
        }
      ]
    };
  }

  /**
   * Transform a single component file
   */
  public transformComponent(inputPath: string, outputPath: string): void {
    try {
      console.log(`🔄 Transforming ${path.basename(inputPath)}...`);
      
      let content = fs.readFileSync(inputPath, 'utf-8');
      
      // Add imports at the top (after existing imports)
      content = this.addImports(content);
      
      // Apply transformation rules
      for (const rule of this.config.rules) {
        const originalContent = content;
        content = content.replace(rule.pattern, rule.replacement);
        if (content !== originalContent) {
          console.log(`  ✅ Applied: ${rule.description}`);
        }
      }
      
      // Wrap the main component with EditProvider
      content = this.wrapWithEditProvider(content);
      
      fs.writeFileSync(outputPath, content);
      console.log(`  💾 Saved transformed component to ${path.basename(outputPath)}`);
      
    } catch (error) {
      console.error(`❌ Error transforming ${inputPath}:`, error);
      throw error;
    }
  }

  /**
   * Add necessary imports to the file
   */
  private addImports(content: string): string {
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        insertIndex = i + 1;
      }
    }
    
    // Insert our imports
    const newImports = this.config.imports.join('\n');
    lines.splice(insertIndex, 0, newImports, '');
    
    return lines.join('\n');
  }

  /**
   * Wrap the main component export with EditProvider
   */
  private wrapWithEditProvider(content: string): string {
    // Find the main component function
    const componentMatch = content.match(/export const (\w+) = \(props: (\w+)\) => \{([\s\S]*?)\n\};/);
    
    if (componentMatch) {
      const [fullMatch, componentName, propsType, componentBody] = componentMatch;
      
      // 找到prop解构和其他逻辑
      const destructuringMatch = componentBody.match(/const \{ ([^}]+) \} = \{[\s\S]*?\};/);
      
      if (destructuringMatch) {
        // 提取组件主体的其他部分（state、hooks、函数等）
        const bodyAfterDestructuring = componentBody.substring(componentBody.indexOf(destructuringMatch[0]) + destructuringMatch[0].length);
        const returnMatch = bodyAfterDestructuring.match(/return \(([\s\S]*)\);?\s*$/);
        
        if (returnMatch) {
          const returnContent = returnMatch[1];
          const beforeReturn = bodyAfterDestructuring.substring(0, bodyAfterDestructuring.indexOf('return ('));
          
          const wrappedComponent = `export const ${componentName} = (props: ${propsType} & { isEditMode?: boolean; onUpdate?: (path: string, value: any) => void; basePath?: string }) => {
  const { isEditMode = false, onUpdate = () => {}, basePath } = props;
  
  const handleUpdate = (path: string, value: any) => {
    console.log('Update:', path, value);
    if (onUpdate) {
      onUpdate(path, value);
    }
  };
  
  ${destructuringMatch[0]}${beforeReturn}
  
  return (
    <EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}>
      ${returnContent.trim()}
    </EditProvider>
  );
};`;
          
          content = content.replace(fullMatch, wrappedComponent);
        }
      }
    }
    
    return content;
  }

  /**
   * Transform all components in a directory
   */
  public transformDirectory(originDir: string, targetDir: string): void {
    try {
      console.log(`📂 Transforming components from ${originDir} to ${targetDir}`);
      
      if (!fs.existsSync(originDir)) {
        throw new Error(`Origin directory does not exist: ${originDir}`);
      }
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const files = fs.readdirSync(originDir);
      
      for (const file of files) {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const inputPath = path.join(originDir, file);
          const outputPath = path.join(targetDir, file);
          
          this.transformComponent(inputPath, outputPath);
        }
      }
      
      console.log(`🎉 Successfully transformed all components!`);
      
    } catch (error) {
      console.error('❌ Error transforming directory:', error);
      throw error;
    }
  }

  /**
   * Add a custom transformation rule
   */
  public addRule(rule: TransformRule): void {
    this.config.rules.push(rule);
  }
}

// CLI functionality
if (require.main === module) {
  const transformer = new ComponentTransformer();
  
  const originDir = path.join(__dirname, '../src/components/landing-page-original');
  const targetDir = path.join(__dirname, '../src/components/landing-page');
  
  const command = process.argv[2];
  
  switch (command) {
    case 'transform':
      transformer.transformDirectory(originDir, targetDir);
      break;
    case 'single':
      const fileName = process.argv[3];
      if (!fileName) {
        console.error('Please provide a filename');
        process.exit(1);
      }
      const inputPath = path.join(originDir, fileName);
      const outputPath = path.join(targetDir, fileName);
      transformer.transformComponent(inputPath, outputPath);
      break;
    default:
      console.log(`
🔧 Component Transformer
Usage: npm run transform-components [command] [options]

Commands:
  transform     Transform all components from origin to landing-page
  single [file] Transform a single component file

Examples:
  npm run transform-components transform
  npm run transform-components single Navbar1.tsx
      `);
  }
}

export default ComponentTransformer;