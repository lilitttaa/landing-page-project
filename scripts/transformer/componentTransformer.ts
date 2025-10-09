import * as fs from 'fs';
import * as path from 'path';
import { applyAstTransforms } from './astTransforms';
import { applyRegexRules } from './regexTransforms';
import { EDITABLE_IMPORTS, TRANSFORM_RULES } from './config';
import { TransformRule } from './types';

export interface TransformerLogger {
  astApplied?(): void;
  regexApplied?(description: string): void;
  fileSaved?(filePath: string): void;
}

export interface TransformerOptions {
  editableImports?: string[];
  rules?: TransformRule[];
  logger?: TransformerLogger;
}

export class ComponentTransformer {
  private editableImports: string[];
  private rules: TransformRule[];
  private logger?: TransformerLogger;

  constructor(options: TransformerOptions = {}) {
    this.editableImports = options.editableImports ?? EDITABLE_IMPORTS;
    this.rules = options.rules ?? TRANSFORM_RULES;
    this.logger = options.logger;
  }

  public transformComponent(inputPath: string, outputPath: string): void {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const transformed = this.transformContent(content, inputPath);
    fs.writeFileSync(outputPath, transformed);
    this.logger?.fileSaved?.(outputPath);
  }

  public transformContent(content: string, fileName: string): string {
    let updated = applyAstTransforms(content, fileName, this.editableImports);
    if (updated !== content) {
      this.logger?.astApplied?.();
    }

    updated = applyRegexRules(updated, this.rules, (description) => {
      this.logger?.regexApplied?.(description);
    });

    updated = this.ensureDefaultExport(updated);

    return updated;
  }

  public transformDirectory(originDir: string, targetDir: string): void {
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
  }

  private ensureDefaultExport(content: string): string {
    if (/export\s+default\s+/m.test(content)) {
      return content;
    }

    const match = content.match(/export\s+const\s+([A-Za-z0-9_]+)/);
    if (!match) {
      return content;
    }

    const componentName = match[1];
    const trimmed = content.replace(/\s*$/, '');
    return `${trimmed}\n\nexport default ${componentName};\n`;
  }
}
