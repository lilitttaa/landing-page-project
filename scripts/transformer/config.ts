import { TransformRule } from './types';

function findEnclosingMapIndex(content: string, matchIndex: number): string | null {
  const mapRegex = /\.map\(\s*\(([^)]*)\)\s*=>/g;
  let match: RegExpExecArray | null;
  let result: string | null = null;

  while ((match = mapRegex.exec(content)) !== null) {
    const paramsText = match[1];
    const openParenIndex = content.indexOf('(', match.index);
    if (openParenIndex === -1) {
      continue;
    }
    const closeParenIndex = findMatchingParenIndex(content, openParenIndex);
    if (closeParenIndex === -1) {
      continue;
    }

    if (matchIndex < openParenIndex || matchIndex > closeParenIndex) {
      continue;
    }

    const arrowIndex = content.indexOf('=>', match.index);
    if (arrowIndex === -1 || arrowIndex > matchIndex || arrowIndex > closeParenIndex) {
      continue;
    }

    result = extractIndexIdentifier(paramsText);
  }

  return result;
}

function findMatchingParenIndex(content: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < content.length; i++) {
    const char = content[i];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function extractIndexIdentifier(params: string): string {
  let depth = 0;
  let current = '';
  const parts: string[] = [];

  for (let i = 0; i < params.length; i++) {
    const char = params[i];
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  if (parts.length < 2) {
    return 'index';
  }

  const candidate = parts[1].split('=')[0].split(':')[0].trim();
  return candidate || 'index';
}

export const EDITABLE_IMPORTS = [
  'EditableText',
  'EditableImage',
  'EditableLink',
  'EditableButton',
  'EditableArray',
  'EditableDropdownTitle',
  'EditableMenuItem',
  'EditProvider'
];

export const TRANSFORM_RULES: TransformRule[] = [
  {
    pattern: /^["']use client["'];?\s*/m,
    replacement: () => '',
    description: 'Remove client component directive to allow SSR'
  },
  {
    pattern: /from ["']@relume_io\/relume-ui["']/g,
    replacement: () => 'from "../common"',
    description: 'Map Relume UI imports to shared common components'
  },
  {
    pattern: /<(h[1-6]|p|span|div)([^>]*?)>\s*\{([^}]+)\}\s*<\/\1>/g,
    replacement: (match, tag, attrs, varName) => {
      return `<EditableText as="${tag}" path="${varName}" value={${varName}}${attrs}>{${varName}}</EditableText>`;
    },
    description: 'Convert text elements to EditableText'
  },
  {
    pattern: /<Button\s+([^>]*?)>\s*\{([^}]+)\}\s*<\/Button>/g,
    replacement: (match, attrs, textVar, offset, fullText) => {
      const buttonVar = textVar.replace('.title', '');
      const indexIdentifier = findEnclosingMapIndex(fullText, offset);
      const indexExpression = indexIdentifier ?? '0';
      const attrParts = [
        `button={${buttonVar}}`,
        `path="buttons"`,
        `index={${indexExpression}}`
      ];
      const extraAttrs = attrs.trim();
      if (extraAttrs) {
        attrParts.push(extraAttrs);
      }
      return `<EditableButton ${attrParts.join(' ')} />`;
    },
    description: 'Convert Button components to EditableButton'
  },
  {
    pattern: /<img\s+([^>]*?)src=\{([^}]+)\}([^>]*?)(?:alt=\{([^}]+)\})?([^>]*?)\/?>(?:<\/img>)?/g,
    replacement: (match, beforeSrc, srcVar, afterSrc, altVar, afterAlt) => {
      const altPart = altVar ? ` alt={${altVar}}` : '';
      const pathVar = srcVar.includes('.') ? srcVar.split('.').slice(0, -1).join('.') : srcVar;
      return `<EditableImage src={${srcVar}} path="${pathVar}"${altPart}${beforeSrc}${afterSrc}${afterAlt} />`;
    },
    description: 'Convert img tags to EditableImage'
  },
  {
    pattern: /<a\s+([^>]*?)href=\{([^}]+)\}([^>]*?)>\s*\{([^}]+)\}\s*<\/a>/g,
    replacement: (match, beforeHref, hrefVar, afterHref, textVar) => {
      const baseArrayName = hrefVar.includes('.') ? hrefVar.split('.')[0] : 'navLinks';
      const hrefPath = `${baseArrayName}.\${index}.url`;
      const textPath = `${baseArrayName}.\${index}.title`;
      const attrs = (beforeHref + afterHref).trim();
      return `<EditableLink href={${hrefVar}} path={\`${hrefPath}\`} textPath={\`${textPath}\`} text={${textVar}} ${attrs}>{${textVar}}</EditableLink>`;
    },
    description: 'Convert anchor tags with text to EditableLink'
  },
  {
    pattern: /const SubMenu = \(\{\s*navLink,\s*isMobile\s*\}:\s*\{\s*navLink:\s*NavLink;\s*isMobile:\s*boolean;\s*\}\)/g,
    replacement: () => {
      return `const SubMenu = ({ navLink, parentIndex, isMobile }: { navLink: NavLink; parentIndex: number; isMobile: boolean })`;
    },
    description: 'Update SubMenu type definition to include parentIndex'
  },
  {
    pattern: /<SubMenu\s+key=\{index\}\s+navLink=\{navLink\}\s+isMobile=\{isMobile\}\s*\/>/g,
    replacement: () => {
      return `<SubMenu key={index} navLink={navLink} parentIndex={index} isMobile={isMobile} />`;
    },
    description: 'Add parentIndex to SubMenu calls'
  },
  {
    pattern: /<EditableText\s+([^>]*?)path="navLink\.title"\s+([^>]*?)>\s*\{([^}]+)\}\s*<\/EditableText>/g,
    replacement: (match, beforeAttrs, afterAttrs, textVar) => {
      const allAttrs = (beforeAttrs + afterAttrs).trim();
      return `<EditableDropdownTitle title={${textVar}} path={\`navLinks.\${parentIndex}.title\`} ${allAttrs}>{${textVar}}</EditableDropdownTitle>`;
    },
    description: 'Convert dropdown menu titles to EditableDropdownTitle'
  },
  {
    pattern: /<EditableLink\s+([^>]*?)path=\{`navLink\.(\$\{[^}]+\})\.([^`]+)`\}\s+([^>]*?)>/g,
    replacement: (match, beforePath, indexPart, property, afterPath) => {
      const beforeAttrs = beforePath.trim();
      const afterAttrs = afterPath.trim();
      return `<EditableLink ${beforeAttrs}path={\`navLinks.${indexPart}.${property}\`} ${afterAttrs}>`;
    },
    description: 'Fix EditableLink paths from navLink to navLinks'
  },
  {
    pattern: /textPath=\{`navLink\.(\$\{[^}]+\})\.([^`]+)`\}/g,
    replacement: (match, indexPart, property) => {
      return `textPath={\`navLinks.${indexPart}.${property}\`}`;
    },
    description: 'Fix EditableLink textPath from navLink to navLinks'
  },
  {
    pattern: /(\{navLink\.subMenuLinks\?\.map\([^}]+\) => \(\s*<EditableLink[^>]+)path=\{`navLinks\.\$\{index\}\.url`\}([^>]+)textPath=\{`navLinks\.\$\{index\}\.title`\}/g,
    replacement: (match, beforePath, middle) => {
      return `${beforePath}path={\`navLinks.\${parentIndex}.subMenuLinks.\${index}.url\`}${middle}textPath={\`navLinks.\${parentIndex}.subMenuLinks.\${index}.title\`}`;
    },
    description: 'Fix SubMenu sublinks to use correct nested path'
  },
  {
    pattern: /<EditableArray path="navLinks" as="fragment">\{navLinks\.map\((navLink, index)\s*=>\s*navLink\.subMenuLinks && navLink\.subMenuLinks\.length > 0 \?\s*\(\s*<SubMenu[^>]*\/>\s*\)\s*:\s*\(\s*<EditableLink[^>]*>[^<]*<\/EditableLink>\s*\),?\s*\)\}<\/EditableArray>/g,
    replacement: () => {
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
  {
    pattern: /\{([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*map\s*\(\s*\(([^,)]+)(?:,\s*([^)]+))?\)\s*=>\s*([\s\S]*?)\)\s*\}/g,
    replacement: (match, arrayVar, itemVar, indexVar, content) => {
      const indexParam = indexVar || 'index';
      return `<EditableArray path="${arrayVar}" as="fragment">{${arrayVar}.map((${itemVar}, ${indexParam}) => ${content})}</EditableArray>`;
    },
    description: 'Wrap array mappings with EditableArray (layout-preserving)'
  }
];
