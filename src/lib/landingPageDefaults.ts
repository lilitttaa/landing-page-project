import { ComponentDataValidator } from './componentDataValidator';

interface LandingPageBlockConfig {
  type: string;
  subtype: string;
  overrides?:
    | Record<string, any>
    | ((context: { projectId: string; description?: string }) => Record<string, any>);
}

export interface LandingPageBlock {
  type: string;
  subtype: string;
  content: string;
}

export interface LandingPageData {
  sitemap: string[];
  blocks: Record<string, LandingPageBlock>;
  block_contents: Record<string, Record<string, any>>;
}

const componentDataValidator = new ComponentDataValidator();

const DEFAULT_BLOCK_CONFIG: LandingPageBlockConfig[] = [
  {
    type: 'navbar',
    subtype: 'Navbar1',
  },
  {
    type: 'hero_header_section',
    subtype: 'Header3',
    overrides: ({ description }) => ({
      heading: description?.trim() || 'Build Beautiful Landing Pages',
    }),
  },
];

function getBlockContent(
  subtype: string,
  overrides: Record<string, any>
): Record<string, any> {
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
  const blockContents: Record<string, Record<string, any>> = {};

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
