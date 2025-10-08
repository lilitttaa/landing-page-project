export interface TransformRule {
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
  description: string;
}

export interface TransformConfig {
  editableImports: string[];
  rules: TransformRule[];
}
