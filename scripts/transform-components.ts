#!/usr/bin/env node

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface TransformConfig {
  sourceDir: string;
  outputDir?: string;
  dryRun?: boolean;
  verbose?: boolean;
  excludePatterns?: string[];
}

interface EditableElementMapping {
  type: 'text' | 'image' | 'link' | 'button' | 'button_component' | 'array';
  wrapperComponent: string;
  pathExtractor: (node: ts.JsxElement | ts.JsxSelfClosingElement, context: TransformContext) => string;
  shouldTransform: (node: ts.JsxElement | ts.JsxSelfClosingElement) => boolean;
}

interface TransformContext {
  sourceFile: ts.SourceFile;
  blockId: string;
  pathCounter: number;
  usedPaths: Set<string>;
}

class ComponentTransformer {
  private config: TransformConfig;
  private editableMappings: EditableElementMapping[] = [];

  constructor(config: TransformConfig) {
    this.config = config;
    this.setupEditableMappings();
  }

  private setupEditableMappings() {
    this.editableMappings = [
      // Text elements (h1, h2, h3, h4, h5, h6, p, span) - only if they contain simple text
      {
        type: 'text',
        wrapperComponent: 'EditableText',
        shouldTransform: (node) => {
          const tagName = this.getTagName(node);
          const isTextElement = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName);
          return isTextElement && this.hasOnlySimpleTextContent(node);
        },
        pathExtractor: (node, context) => this.generatePath(node, context, 'text')
      },
      // Images - all img elements
      {
        type: 'image',
        wrapperComponent: 'EditableImage',
        shouldTransform: (node) => {
          return ts.isJsxSelfClosingElement(node) && this.getTagName(node) === 'img';
        },
        pathExtractor: (node, context) => this.generatePath(node, context, 'image')
      },
      // Links - more permissive, include JSX expression content
      {
        type: 'link',
        wrapperComponent: 'EditableLink',
        shouldTransform: (node) => {
          const tagName = this.getTagName(node);
          return tagName === 'a' && this.hasEditableLinkContent(node);
        },
        pathExtractor: (node, context) => this.generatePath(node, context, 'link')
      },
      // Button components - look for specific patterns
      {
        type: 'button_component',
        wrapperComponent: 'EditableButton',
        shouldTransform: (node) => {
          const tagName = this.getTagName(node);
          return tagName === 'Button' && this.hasEditableButtonContent(node);
        },
        pathExtractor: (node, context) => this.generatePath(node, context, 'button')
      },
      // Regular buttons - only if they contain simple text content
      {
        type: 'button',
        wrapperComponent: 'EditableButton',
        shouldTransform: (node) => {
          const tagName = this.getTagName(node);
          return tagName === 'button' && this.hasOnlySimpleTextContent(node);
        },
        pathExtractor: (node, context) => this.generatePath(node, context, 'button')
      }
    ];
  }

  private hasOnlySimpleTextContent(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
    if (ts.isJsxSelfClosingElement(node)) return false;
    
    return node.children.every(child => 
      ts.isJsxText(child) || 
      (ts.isJsxExpression(child) && child.expression && ts.isIdentifier(child.expression))
    );
  }

  private hasEditableLinkContent(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
    if (ts.isJsxSelfClosingElement(node)) return false;
    
    const children = node.children.filter(child => 
      !ts.isJsxText(child) || child.text.trim().length > 0
    );
    
    if (children.length === 0) return false;
    
    // Allow text/expressions, or single img element, or single complex child
    if (children.length === 1) {
      const child = children[0];
      if (ts.isJsxText(child) || 
          (ts.isJsxExpression(child) && child.expression) || // Accept any JSX expression
          (ts.isJsxSelfClosingElement(child) && this.getTagName(child) === 'img')) {
        return true;
      }
    }
    
    // Allow all text/expressions
    if (children.every(child => 
      ts.isJsxText(child) || 
      (ts.isJsxExpression(child) && child.expression) // Accept any JSX expression
    )) {
      return true;
    }
    
    return false;
  }

  private hasEditableButtonContent(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
    if (ts.isJsxSelfClosingElement(node)) return false;
    
    // For Button components, check if they have text children or JSX expressions
    return node.children.some(child => 
      (ts.isJsxText(child) && child.text.trim().length > 0) ||
      (ts.isJsxExpression(child) && child.expression) // Accept any JSX expression
    );
  }

  private getTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    const tagNameNode = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;
    if (ts.isIdentifier(tagNameNode)) {
      return tagNameNode.text;
    }
    return '';
  }

  private generatePath(node: ts.JsxElement | ts.JsxSelfClosingElement, context: TransformContext, type: string): string {
    // Generate a unique path based on the element type and position
    const basePath = `${type}_${context.pathCounter++}`;
    let path = basePath;
    let counter = 1;
    
    while (context.usedPaths.has(path)) {
      path = `${basePath}_${counter++}`;
    }
    
    context.usedPaths.add(path);
    return path;
  }

  private hasTextContent(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
    if (ts.isJsxSelfClosingElement(node)) return false;
    
    return node.children.some(child => 
      ts.isJsxText(child) && child.text.trim().length > 0
    );
  }

  private extractTextContent(node: ts.JsxElement): string {
    const textNodes = node.children.filter(child => 
      ts.isJsxText(child) && child.text.trim().length > 0
    ) as ts.JsxText[];
    
    return textNodes.map(text => text.text.trim()).join(' ');
  }

  public async transformFile(filePath: string): Promise<string> {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const transformContext: TransformContext = {
      sourceFile,
      blockId: 'block', // This should be dynamically determined
      pathCounter: 0,
      usedPaths: new Set()
    };

    let needsEditableImport = false;
    const usedWrappers = new Set<string>();

    const transformer = <T extends ts.Node>(tsContext: ts.TransformationContext) => {
      const visit = (node: ts.Node): ts.Node => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          const mapping = this.editableMappings.find(m => m.shouldTransform(node));
          
          if (mapping) {
            needsEditableImport = true;
            usedWrappers.add(mapping.wrapperComponent);
            return this.transformToEditableWrapper(node, mapping, transformContext);
          }
        }
        
        return ts.visitEachChild(node, visit, tsContext);
      };
      
      return (node: T) => ts.visitNode(node, visit) as T;
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedSourceFile = result.transformed[0] as ts.SourceFile;
    
    // Add imports if needed
    let finalCode = '';
    if (needsEditableImport) {
      const imports = Array.from(usedWrappers);
      finalCode = this.addEditableImports(transformedSourceFile, imports);
    } else {
      const printer = ts.createPrinter();
      finalCode = printer.printFile(transformedSourceFile);
    }

    result.dispose();
    return finalCode;
  }

  private transformToEditableWrapper(
    node: ts.JsxElement | ts.JsxSelfClosingElement, 
    mapping: EditableElementMapping,
    transformContext: TransformContext
  ): ts.JsxElement {
    const path = mapping.pathExtractor(node, transformContext);
    
    switch (mapping.type) {
      case 'text':
        return this.createEditableTextWrapper(node as ts.JsxElement, path);
      case 'image':
        return this.createEditableImageWrapper(node as ts.JsxSelfClosingElement, path);
      case 'link':
        return this.createEditableLinkWrapper(node as ts.JsxElement, path);
      case 'button':
        return this.createEditableButtonWrapper(node as ts.JsxElement, path);
      case 'button_component':
        return this.createEditableButtonComponentWrapper(node as ts.JsxElement, path);
      default:
        return node as ts.JsxElement;
    }
  }

  private createEditableTextWrapper(node: ts.JsxElement, path: string): ts.JsxElement {
    const tagName = this.getTagName(node);
    
    // Extract text content from the original node
    const textContent = node.children
      .filter(child => ts.isJsxText(child))
      .map(child => (child as ts.JsxText).text.trim())
      .filter(text => text.length > 0)
      .join(' ');

    // Extract JSX expression children (like {title})
    const jsxExpressions = node.children.filter(child => ts.isJsxExpression(child));
    
    // Create children array - either text content or JSX expressions
    const children = jsxExpressions.length > 0 
      ? jsxExpressions  // Use original JSX expressions
      : textContent ? [ts.factory.createJsxText(textContent)] : [];

    // Extract non-class attributes from original node
    const originalAttributes = node.openingElement.attributes?.properties.filter(prop => {
      if (ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name)) {
        return prop.name.text !== 'className';
      }
      return true;
    }) || [];

    // Extract className attribute
    const classNameAttr = node.openingElement.attributes?.properties.find(prop => 
      ts.isJsxAttribute(prop) && 
      ts.isIdentifier(prop.name) && 
      prop.name.text === 'className'
    );

    // Create EditableText wrapper
    const attributes = [
      ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('path'),
        ts.factory.createStringLiteral(path)
      ),
      ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('as'),
        ts.factory.createStringLiteral(tagName)
      ),
      ...originalAttributes
    ];

    // Add className if it exists
    if (classNameAttr) {
      attributes.push(classNameAttr);
    }

    const openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier('EditableText'),
      undefined,
      ts.factory.createJsxAttributes(attributes)
    );

    const closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier('EditableText')
    );

    return ts.factory.createJsxElement(openingElement, children, closingElement);
  }

  private createEditableImageWrapper(node: ts.JsxSelfClosingElement, path: string): ts.JsxElement {
    // Convert self-closing element to regular element for consistency
    const openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier('EditableImage'),
      undefined,
      ts.factory.createJsxAttributes([
        ts.factory.createJsxAttribute(
          ts.factory.createIdentifier('path'),
          ts.factory.createStringLiteral(path)
        ),
        ...(node.attributes?.properties || [])
      ])
    );

    const closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier('EditableImage')
    );

    return ts.factory.createJsxElement(openingElement, [], closingElement);
  }

  private createEditableLinkWrapper(node: ts.JsxElement, path: string): ts.JsxElement {
    // Extract all children (text, JSX expressions, and other elements)
    const children = node.children.filter(child => 
      ts.isJsxText(child) && child.text.trim().length > 0 ||
      ts.isJsxExpression(child) ||
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child)
    );
    
    // Extract non-href attributes
    const originalAttributes = node.openingElement.attributes?.properties.filter(prop => {
      if (ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name)) {
        return prop.name.text !== 'href';
      }
      return true;
    }) || [];

    // Extract href attribute
    const hrefAttr = node.openingElement.attributes?.properties.find(prop => 
      ts.isJsxAttribute(prop) && 
      ts.isIdentifier(prop.name) && 
      prop.name.text === 'href'
    );

    const attributes = [
      ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('textPath'),
        ts.factory.createStringLiteral(`${path}.text`)
      ),
      ts.factory.createJsxAttribute(
        ts.factory.createIdentifier('urlPath'),
        ts.factory.createStringLiteral(`${path}.url`)
      ),
      ...originalAttributes
    ];

    // Add href if it exists
    if (hrefAttr) {
      attributes.push(hrefAttr);
    }

    const openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier('EditableLink'),
      undefined,
      ts.factory.createJsxAttributes(attributes)
    );

    const closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier('EditableLink')
    );

    return ts.factory.createJsxElement(openingElement, children, closingElement);
  }

  private createEditableButtonWrapper(node: ts.JsxElement, path: string): ts.JsxElement {
    // Extract all children (text and JSX expressions)
    const children = node.children.filter(child => 
      ts.isJsxText(child) || ts.isJsxExpression(child)
    );
    
    const openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier('EditableButton'),
      undefined,
      ts.factory.createJsxAttributes([
        ts.factory.createJsxAttribute(
          ts.factory.createIdentifier('textPath'),
          ts.factory.createStringLiteral(`${path}.text`)
        ),
        ...(node.openingElement.attributes?.properties || [])
      ])
    );

    const closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier('EditableButton')
    );

    return ts.factory.createJsxElement(openingElement, children, closingElement);
  }

  private createEditableButtonComponentWrapper(node: ts.JsxElement, path: string): ts.JsxElement {
    // For Button components, we need to handle them specially
    // Extract the text content from children
    const textChildren = node.children.filter(child => 
      ts.isJsxText(child) && child.text.trim().length > 0 ||
      (ts.isJsxExpression(child) && child.expression && ts.isIdentifier(child.expression))
    );
    
    // Create a wrapper that preserves the Button component structure
    const openingElement = ts.factory.createJsxOpeningElement(
      ts.factory.createIdentifier('EditableButton'),
      undefined,
      ts.factory.createJsxAttributes([
        ts.factory.createJsxAttribute(
          ts.factory.createIdentifier('textPath'),
          ts.factory.createStringLiteral(`${path}.text`)
        ),
        ts.factory.createJsxAttribute(
          ts.factory.createIdentifier('as'),
          ts.factory.createStringLiteral('Button')
        ),
        ...(node.openingElement.attributes?.properties || [])
      ])
    );

    const closingElement = ts.factory.createJsxClosingElement(
      ts.factory.createIdentifier('EditableButton')
    );

    return ts.factory.createJsxElement(openingElement, textChildren, closingElement);
  }

  private addEditableImports(sourceFile: ts.SourceFile, wrapperComponents: string[]): string {
    const printer = ts.createPrinter();
    
    // Find existing imports and "use client" directive
    let hasUseClient = false;
    let useClientIndex = -1;
    let firstImportIndex = -1;
    
    const statements = [...sourceFile.statements];
    
    // Check for "use client" directive and imports
    statements.forEach((statement, index) => {
      if (ts.isExpressionStatement(statement) && 
          ts.isStringLiteral(statement.expression) && 
          statement.expression.text === 'use client') {
        hasUseClient = true;
        useClientIndex = index;
      } else if (ts.isImportDeclaration(statement) && firstImportIndex === -1) {
        firstImportIndex = index;
      }
    });
    
    // Create import statement
    const importDeclaration = ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports(
          wrapperComponents.map(comp => 
            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(comp))
          )
        )
      ),
      ts.factory.createStringLiteral('@/components/editable')
    );

    let updatedStatements: ts.Statement[] = [];
    
    if (hasUseClient) {
      // If "use client" exists, place it first, then our import, then the rest
      const useClientStatement = statements[useClientIndex];
      const otherStatements = statements.filter((_, index) => index !== useClientIndex);
      
      updatedStatements = [
        useClientStatement,
        importDeclaration,
        ...otherStatements
      ];
    } else if (firstImportIndex !== -1) {
      // If no "use client" but has imports, add our import before other imports
      updatedStatements = [
        ...statements.slice(0, firstImportIndex),
        importDeclaration,
        ...statements.slice(firstImportIndex)
      ];
    } else {
      // No "use client" and no imports, add import at the beginning
      updatedStatements = [importDeclaration, ...statements];
    }

    const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
    return printer.printFile(updatedSourceFile);
  }

  public async transformDirectory(dirPath: string): Promise<void> {
    const files = this.getAllTsxFiles(dirPath);
    
    for (const file of files) {
      if (this.shouldExcludeFile(file)) {
        continue;
      }

      try {
        if (this.config.verbose) {
          console.log(`Processing: ${file}`);
        }

        const transformedCode = await this.transformFile(file);
        
        if (this.config.dryRun) {
          console.log(`\n=== ${file} ===`);
          console.log(transformedCode);
        } else {
          const outputPath = this.config.outputDir 
            ? path.join(this.config.outputDir, path.relative(this.config.sourceDir, file))
            : file;
          
          // Ensure output directory exists
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(outputPath, transformedCode, 'utf-8');
          console.log(`Transformed: ${file} -> ${outputPath}`);
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }

  private getAllTsxFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath);
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (entry.endsWith('.tsx') && !entry.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dirPath);
    return files;
  }

  private shouldExcludeFile(filePath: string): boolean {
    if (!this.config.excludePatterns) return false;
    
    return this.config.excludePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  const config: TransformConfig = {
    sourceDir: 'src/components/original', // 默认源目录
    outputDir: 'src/components/landing-page', // 默认输出目录
    dryRun: false,
    verbose: false,
    excludePatterns: []
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
        console.log(`
Usage: npm run transform-components [options] [source-directory]

Options:
  --output <dir>      Output directory (default: src/components/landing-page)
  --dry-run          Show transformed code without writing files
  --verbose          Show detailed processing information
  --exclude <pattern> Exclude files matching pattern (can be used multiple times)

Examples:
  npm run transform-components
  npm run transform-components --dry-run --verbose
  npm run transform-components --output ./transformed
  npm run transform-components src/components/original
        `);
        return;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--exclude':
        config.excludePatterns = config.excludePatterns || [];
        config.excludePatterns.push(args[++i]);
        break;
      default:
        if (!arg.startsWith('--')) {
          config.sourceDir = arg; // 覆盖默认源目录
        }
        break;
    }
  }

  if (!fs.existsSync(config.sourceDir)) {
    console.error(`Error: Source directory does not exist: ${config.sourceDir}`);
    process.exit(1);
  }

  const transformer = new ComponentTransformer(config);
  
  console.log(`Transforming components in: ${config.sourceDir}`);
  if (config.outputDir) {
    console.log(`Output directory: ${config.outputDir}`);
  }
  if (config.dryRun) {
    console.log('DRY RUN MODE - No files will be modified');
  }
  
  await transformer.transformDirectory(config.sourceDir);
  
  console.log('Transformation complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { ComponentTransformer };
export type { TransformConfig };