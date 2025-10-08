import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { ProjectGenerator } from '../../src/lib/projectGenerator';

describe('ProjectGenerator landing-page integration', () => {
  const generator = new ProjectGenerator();

  it('serializes nested props generically for landing page blocks', () => {
    const content = {
      heading: 'Reach More Customers',
      description: 'Convert visitors with a compelling hero section.',
      stats: [
        { label: 'Users', value: 1200 },
        { label: 'Downloads', value: 4500 }
      ],
      media: {
        src: 'https://example.com/image.png',
        alt: 'Demo screenshot'
      }
    };

    const props = (generator as any).generateComponentProps('GenericBlock', content) as string;

    assert.match(props, /heading="Reach More Customers"/);
    assert.ok(props.includes('stats={[{'), 'expected array values to be serialized');
    assert.match(props, /media=\{/);
  });

  it('copies every referenced landing-page component into the generated project', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(process.cwd(), 'tmp-project-'));

    const landingSourceDir = path.join(process.cwd(), 'src', 'components', 'landing-page');
    const componentFiles = (await fs.promises.readdir(landingSourceDir)).filter((file) =>
      file.endsWith('.tsx')
    );

    const componentNames = componentFiles.map((file) => path.parse(file).name);
    assert.ok(componentNames.length > 0, 'expected landing-page components to exist');

    const landingPageData = {
      sitemap: componentNames.map((_, index) => `block_${index.toString().padStart(3, '0')}`),
      blocks: {} as Record<string, any>,
      block_contents: {} as Record<string, any>
    };

    componentNames.forEach((name, index) => {
      const blockId = landingPageData.sitemap[index];
      landingPageData.blocks[blockId] = {
        type: 'component',
        subtype: name,
        content: `content_${index.toString().padStart(3, '0')}`
      };
      landingPageData.block_contents[`content_${index.toString().padStart(3, '0')}`] = {};
    });

    await (generator as any).copyComponentsWithDependencies(tempDir, landingPageData as any);

    const copiedComponents = componentNames.filter((name) =>
      fs.existsSync(path.join(tempDir, 'src', 'components', `${name}.tsx`))
    );

    await fs.promises.rm(tempDir, { recursive: true, force: true });

    assert.deepEqual(
      new Set(copiedComponents),
      new Set(componentNames),
      'expected every referenced component to be copied'
    );
  });

  it('builds a generated project successfully using metadata defaults', async () => {
    const projectId = `deploy-${Date.now()}`;
    const landingPageData = {
      sitemap: ['block_001', 'block_002'],
      blocks: {
        block_001: {
          type: 'navbar',
          subtype: 'Navbar1',
          content: 'content_001'
        },
        block_002: {
          type: 'hero_header_section',
          subtype: 'Header3',
          content: 'content_002'
        }
      },
      block_contents: {
        content_001: {
          logo: {
            url: '#',
            src: 'https://example.com/logo.svg',
            alt: 'Logo'
          },
          navLinks: [
            { title: 'Home', url: '#' },
            { title: 'About', url: '#' }
          ],
          buttons: [
            { title: 'Get Started', variant: 'secondary', size: 'sm' }
          ]
        },
        content_002: {
          heading: 'Build Beautiful Landing Pages',
          description: 'Create stunning pages with metadata-driven defaults.',
          buttons: [{ title: 'Primary CTA' }],
          video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          image: {
            src: 'https://example.com/image.png',
            alt: 'Hero'
          }
        }
      }
    };

    const projectPath = await generator.generateProject(projectId, landingPageData as any);

    try {
      const editableDir = path.join(projectPath, 'src', 'editable');
      const expectedFiles = [
        'EditProvider.tsx',
        'EditableArray.tsx',
        'EditableText.tsx',
        'EditableDropdownTitle.tsx',
        'EditableImage.tsx',
        'EditableLink.tsx',
        'EditableButton.tsx',
        'EditableMenuItem.tsx',
        'index.ts'
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(editableDir, file);
        assert.ok(fs.existsSync(filePath), `expected ${filePath} to be generated`);
      }

      const buildResult = await generator.buildProjectWithResult(projectPath);
      if (!buildResult.success) {
        const message = buildResult.error?.message || 'unknown build error';
        const stderr = buildResult.stderr ?? '';
        const truncated = stderr.length > 500 ? stderr.slice(0, 500) + '...' : stderr;
        assert.fail(`Build failed: ${message}
${truncated}`);
      }

      const distPath = buildResult.distPath;
      assert.ok(fs.existsSync(distPath), 'expected dist directory to exist after build');
      const indexHtml = path.join(distPath, 'index.html');
      assert.ok(fs.existsSync(indexHtml), 'expected index.html to be generated by build');
      const assetsDir = path.join(distPath, 'assets');
      assert.ok(fs.existsSync(assetsDir), 'expected assets directory');
      const entries = await fs.promises.readdir(assetsDir);
      assert.ok(entries.some((file) => file.endsWith('.js')), 'expected JS asset output from build');
    } finally {
      await fs.promises.rm(projectPath, { recursive: true, force: true });
    }
  });
});




