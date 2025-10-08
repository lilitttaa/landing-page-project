import fs from 'node:fs';
import path from 'node:path';
import { ComponentDataValidator } from './componentDataValidator';

interface LandingPageBlockConfig {
  type: string;
  subtype: string;
  overrides?:
    | Record<string, unknown>
    | ((context: { projectId: string; description?: string }) => Record<string, unknown>);
}

export interface LandingPageBlock {
  type: string;
  subtype: string;
  content: string;
}

export interface LandingPageData {
  sitemap: string[];
  blocks: Record<string, LandingPageBlock>;
  block_contents: Record<string, Record<string, unknown>>;
}

const componentDataValidator = new ComponentDataValidator();

const LANDING_PAGE_COMPONENT_DIR = path.join(
  process.cwd(),
  'src/components/landing-page'
);

const DEFAULT_BLOCK_CONFIG: LandingPageBlockConfig[] = (() => {
  try {
    const entries = fs.readdirSync(LANDING_PAGE_COMPONENT_DIR, {
      withFileTypes: true,
    });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
      .map((entry) => entry.name.replace(/\.tsx$/, ''))
      .sort((a, b) => a.localeCompare(b))
      .map((componentName) => {
        return { type: componentName, subtype: componentName };
      });
  } catch (error) {
    console.warn(
      'Unable to load landing page components for defaults:',
      error
    );
    return [];
  }
})();

function getBlockContent(
  subtype: string,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  try {
    return componentDataValidator.mergeWithDefaults(subtype, overrides);
  } catch (error) {
    console.warn(`Unable to load metadata defaults for ${subtype}:`, error);
    return overrides;
  }
}

export function buildDefaultLandingPageData(context: {
  projectId: string;
  description?: string;
}): LandingPageData {
  const sitemap: string[] = [];
  const blocks: Record<string, LandingPageBlock> = {};
  const blockContents: Record<string, Record<string, unknown>> = {};

  DEFAULT_BLOCK_CONFIG.forEach((config, index) => {
    const blockId = `block_${String(index + 1).padStart(3, '0')}`;
    const contentId = `content_${String(index + 1).padStart(3, '0')}`;
    sitemap.push(blockId);

    blocks[blockId] = {
      type: config.type,
      subtype: config.subtype,
      content: contentId,
    };

    const overrides =
      typeof config.overrides === 'function'
        ? config.overrides(context)
        : config.overrides || {};

    blockContents[contentId] = getBlockContent(config.subtype, overrides);
  });

  return {
    sitemap,
    blocks,
    block_contents: blockContents,
  };
}
