import { TransformRule } from './types';

export type RegexLogger = (description: string) => void;

export function applyRegexRules(
  content: string,
  rules: TransformRule[],
  logger?: RegexLogger
): string {
  let updatedContent = content;

  for (const rule of rules) {
    const originalContent = updatedContent;
    updatedContent = updatedContent.replace(rule.pattern, rule.replacement);
    if (updatedContent !== originalContent) {
      logger?.(rule.description);
    }
  }

  return updatedContent;
}
