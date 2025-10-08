import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { ComponentTransformer } from '../transformer/componentTransformer';

describe('ComponentTransformer integration', () => {
  const transformer = new ComponentTransformer();
  it('transforms every landing-page-original component with edit scaffolding', () => {
    const originDir = path.join(__dirname, '../../src/components/landing-page-original');
    const files = fs.readdirSync(originDir).filter((file) => file.endsWith('.tsx'));
    assert.ok(files.length > 0, 'expected at least one original component');

    for (const file of files) {
      const filePath = path.join(originDir, file);
      const source = fs.readFileSync(filePath, 'utf-8');
      const transformed = transformer.transformContent(source, filePath);

      assert.match(
        transformed,
        /import { [^}]*EditProvider[^}]* } from "\.\.\/editable";/,
        `transformed ${file} should import editable utilities`
      );
      assert.match(
        transformed,
        /<EditProvider[^>]*>/,
        `transformed ${file} should wrap output in EditProvider`
      );
    }
  });

  it('rewrites external UI imports to shared common components', () => {
    const originDir = path.join(__dirname, '../../src/components/landing-page-original');
    const files = fs.readdirSync(originDir).filter((file) => file.endsWith('.tsx'));

    const modifiedFiles = files.filter((file) => {
      const source = fs.readFileSync(path.join(originDir, file), 'utf-8');
      return source.includes('@relume_io/relume-ui');
    });

    assert.ok(
      modifiedFiles.length > 0,
      'expected at least one component to use external Relume UI imports'
    );

    for (const file of modifiedFiles) {
      const filePath = path.join(originDir, file);
      const source = fs.readFileSync(filePath, 'utf-8');
      const transformed = transformer.transformContent(source, filePath);

      assert.ok(
        transformed.includes('from "../common"'),
        `expected transformed ${file} to import from ../common`
      );
      assert.ok(
        !transformed.includes('@relume_io/relume-ui'),
        `expected third-party Relume UI import to be removed from ${file}`
      );
    }
  });

  it('injects submenu parent index context for dropdown links', () => {
    const sampleSource = `
      import { EditableText, EditableLink } from "../editable";

      type NavLink = { title: string; url: string; subMenuLinks?: { title: string; url: string }[] };

      const SubMenu = ({ navLink, isMobile }: { navLink: NavLink; isMobile: boolean }) => {
        return (
          <>
            <EditableText as="span" path="navLink.title" value={navLink.title}>
              {navLink.title}
            </EditableText>
            {navLink.subMenuLinks?.map((subLink, index) => (
              <EditableLink
                key={index}
                href={subLink.url}
                path={\`navLinks.\${index}.url\`}
                textPath={\`navLinks.\${index}.title\`}
                text={subLink.title}
              >
                {subLink.title}
              </EditableLink>
            ))}
          </>
        );
      };

      export const Component = ({
        navLinks,
        isMobile,
      }: {
        navLinks: NavLink[];
        isMobile: boolean;
      }) => (
        <>
          {navLinks.map((navLink, index) =>
            navLink.subMenuLinks && navLink.subMenuLinks.length > 0 ? (
              <SubMenu key={index} navLink={navLink} isMobile={isMobile} />
            ) : (
              <EditableLink
                key={index}
                href={navLink.url}
                path={\`navLinks.\${index}.url\`}
                textPath={\`navLinks.\${index}.title\`}
                text={navLink.title}
              >
                {navLink.title}
              </EditableLink>
            )
          )}
        </>
      );
    `;

    const transformed = transformer.transformContent(sampleSource, 'NavbarSample.tsx');

    assert.match(
      transformed,
      /const SubMenu = \(\{\s*navLink,\s*parentIndex,\s*isMobile[^}]*\}\s*:\s*\{\s*navLink:\s*NavLink;[^}]*parentIndex:\s*number;[^}]*isMobile:\s*boolean[^}]*\}\)/,
      'expected SubMenu signature to accept parentIndex'
    );
    assert.match(
      transformed,
      /<SubMenu key=\{index\} navLink=\{navLink\} parentIndex=\{index\} isMobile=\{isMobile\} \/>/,
      'expected parentIndex prop to be forwarded when rendering SubMenu'
    );
    assert.match(
      transformed,
      /path=\{`navLinks\.\${parentIndex}\.subMenuLinks\.\${index}\.url`}/,
      'expected nested submenu link paths to reference parentIndex'
    );
    assert.match(
      transformed,
      /textPath=\{`navLinks\.\${parentIndex}\.subMenuLinks\.\${index}\.title`}/,
      'expected nested submenu text paths to reference parentIndex'
    );
  });
});
