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
});
