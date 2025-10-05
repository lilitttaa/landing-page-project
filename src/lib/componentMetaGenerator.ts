import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ComponentMetaData, PropertyDefinition } from '../types/component-meta';

export class ComponentMetaGenerator {
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(private componentsDir: string) {
    // Create TypeScript program
    const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
    const { config } = ts.readConfigFile(configPath!, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(config, ts.sys, './');
    
    this.program = ts.createProgram(fileNames, options);
    this.checker = this.program.getTypeChecker();
  }

  generateMetaData(componentFilePath: string): ComponentMetaData {
    const sourceFile = this.program.getSourceFile(componentFilePath);
    if (!sourceFile) {
      throw new Error(`Could not find source file: ${componentFilePath}`);
    }

    const componentName = this.extractComponentName(componentFilePath);
    const propsInterface = this.findPropsInterface(sourceFile, componentName);
    const defaultsExport = this.findDefaultsExport(sourceFile, componentName);

    const metaData: ComponentMetaData = {
      componentName,
      version: '1.0.0',
      description: this.extractComponentDescription(sourceFile),
      properties: {},
      types: {},
      defaults: defaultsExport
    };

    if (propsInterface) {
      metaData.properties = this.extractPropertiesFromInterface(propsInterface);
      metaData.types = this.extractNestedTypes(sourceFile);
    }

    return metaData;
  }

  private extractComponentName(filePath: string): string {
    const fileName = path.basename(filePath, '.tsx');
    return fileName;
  }

  private findPropsInterface(sourceFile: ts.SourceFile, componentName: string): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | null {
    const propsInterfaceName = `${componentName}Props`;
    const propsTypeName = 'Props';
    
    for (const statement of sourceFile.statements) {
      // Check for exported interface
      if (ts.isInterfaceDeclaration(statement) && statement.name.text === propsInterfaceName) {
        return statement;
      }
      // Check for internal Props type
      if (ts.isTypeAliasDeclaration(statement) && statement.name.text === propsTypeName) {
        return statement;
      }
    }
    return null;
  }

  private findDefaultsExport(sourceFile: ts.SourceFile, componentName: string): any {
    const defaultsName = `${componentName}Defaults`;
    
    for (const statement of sourceFile.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && 
              declaration.name.text === defaultsName &&
              declaration.initializer) {
            return this.extractObjectLiteralValue(declaration.initializer);
          }
        }
      }
    }
    return null;
  }

  private extractPropertiesFromInterface(interfaceDecl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration): Record<string, PropertyDefinition> {
    const properties: Record<string, PropertyDefinition> = {};

    if (ts.isInterfaceDeclaration(interfaceDecl)) {
      // Handle interface declaration
      for (const member of interfaceDecl.members) {
        if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
          const propertyName = member.name.text;
          const propertyDef = this.extractPropertyDefinition(member);
          properties[propertyName] = propertyDef;
        }
      }
    } else if (ts.isTypeAliasDeclaration(interfaceDecl) && ts.isTypeLiteralNode(interfaceDecl.type)) {
      // Handle type alias with object literal
      for (const member of interfaceDecl.type.members) {
        if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
          const propertyName = member.name.text;
          const propertyDef = this.extractPropertyDefinition(member);
          properties[propertyName] = propertyDef;
        }
      }
    }

    return properties;
  }

  private extractPropertyDefinition(property: ts.PropertySignature): PropertyDefinition {
    const type = property.type;
    const isOptional = !!property.questionToken;

    if (!type) {
      return {
        type: 'string',
        required: !isOptional,
        description: this.extractJSDocComment(property)
      };
    }

    return {
      ...this.extractTypeDefinition(type),
      required: !isOptional,
      description: this.extractJSDocComment(property)
    };
  }

  private extractTypeDefinition(typeNode: ts.TypeNode): Omit<PropertyDefinition, 'required' | 'description'> {
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword:
        return { type: 'string' };
      
      case ts.SyntaxKind.NumberKeyword:
        return { type: 'number' };
      
      case ts.SyntaxKind.BooleanKeyword:
        return { type: 'boolean' };
      
      case ts.SyntaxKind.ArrayType:
        const arrayType = typeNode as ts.ArrayTypeNode;
        return {
          type: 'array',
          arrayItemType: this.extractTypeDefinition(arrayType.elementType)
        };
      
      case ts.SyntaxKind.TypeReference:
        const typeRef = typeNode as ts.TypeReferenceNode;
        const typeName = (typeRef.typeName as ts.Identifier).text;
        
        // Handle common generic types
        if (typeName === 'Array' && typeRef.typeArguments && typeRef.typeArguments.length > 0) {
          return {
            type: 'array',
            arrayItemType: this.extractTypeDefinition(typeRef.typeArguments[0])
          };
        }
        
        // Handle custom types - assume they are objects
        return { type: 'object' };
      
      case ts.SyntaxKind.TypeLiteral:
        const typeLiteral = typeNode as ts.TypeLiteralNode;
        const properties: Record<string, PropertyDefinition> = {};
        
        for (const member of typeLiteral.members) {
          if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
            properties[member.name.text] = this.extractPropertyDefinition(member);
          }
        }
        
        return {
          type: 'object',
          properties
        };
      
      default:
        return { type: 'string' }; // fallback
    }
  }

  private extractNestedTypes(sourceFile: ts.SourceFile): Record<string, Record<string, PropertyDefinition>> {
    const types: Record<string, Record<string, PropertyDefinition>> = {};

    for (const statement of sourceFile.statements) {
      if (ts.isTypeAliasDeclaration(statement)) {
        const typeName = statement.name.text;
        if (statement.type && ts.isTypeLiteralNode(statement.type)) {
          const properties: Record<string, PropertyDefinition> = {};
          
          for (const member of statement.type.members) {
            if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
              properties[member.name.text] = this.extractPropertyDefinition(member);
            }
          }
          
          types[typeName] = properties;
        }
      }
    }

    return types;
  }

  private extractObjectLiteralValue(node: ts.Node): any {
    if (ts.isObjectLiteralExpression(node)) {
      const result: any = {};
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
          const key = property.name.text;
          result[key] = this.extractLiteralValue(property.initializer);
        }
      }
      return result;
    }
    return this.extractLiteralValue(node);
  }

  private extractLiteralValue(node: ts.Node): any {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        return (node as ts.StringLiteral).text;
      case ts.SyntaxKind.NumericLiteral:
        return Number((node as ts.NumericLiteral).text);
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.extractObjectLiteralValue(node);
      case ts.SyntaxKind.ArrayLiteralExpression:
        const arrayLiteral = node as ts.ArrayLiteralExpression;
        return arrayLiteral.elements.map(element => this.extractLiteralValue(element));
      default:
        return null;
    }
  }

  private extractJSDocComment(node: ts.Node): string | undefined {
    const jsDoc = (node as any).jsDoc;
    if (jsDoc && jsDoc.length > 0) {
      return jsDoc[0].comment;
    }
    return undefined;
  }

  private extractComponentDescription(sourceFile: ts.SourceFile): string | undefined {
    // Look for component description in file-level JSDoc comments
    const fullText = sourceFile.getFullText();
    const commentMatch = fullText.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    return commentMatch ? commentMatch[1] : undefined;
  }

  async generateAllMetaData(): Promise<void> {
    const componentFiles = fs.readdirSync(this.componentsDir)
      .filter(file => file.endsWith('.tsx') && !file.includes('.d.ts'))
      .map(file => path.join(this.componentsDir, file));

    for (const componentFile of componentFiles) {
      try {
        const metaData = this.generateMetaData(componentFile);
        const outputPath = path.join(
          this.componentsDir, 
          '..', 
          'meta',
          `${metaData.componentName}.meta.json`
        );
        
        // Ensure meta directory exists
        const metaDir = path.dirname(outputPath);
        if (!fs.existsSync(metaDir)) {
          fs.mkdirSync(metaDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, JSON.stringify(metaData, null, 2));
        console.log(`Generated meta data for ${metaData.componentName}`);
      } catch (error) {
        console.error(`Error generating meta data for ${componentFile}:`, error);
      }
    }
  }
}