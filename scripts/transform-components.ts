import * as path from 'path';
import { ComponentTransformer } from './transformer/componentTransformer';

const transformer = new ComponentTransformer();

function showHelp() {
  console.log(`
Component Transformer
Usage: npm run transform-components [command] [options]

Commands:
  transform          Transform all components from origin to landing-page
  single <filename>  Transform a single component file

Examples:
  npm run transform-components transform
  npm run transform-components single Navbar1.tsx
  `);
}

function run() {
  const originDir = path.join(__dirname, '../src/components/landing-page-original');
  const targetDir = path.join(__dirname, '../src/components/landing-page');

  const command = process.argv[2];

  switch (command) {
    case 'transform':
      transformer.transformDirectory(originDir, targetDir);
      break;
    case 'single': {
      const fileName = process.argv[3];
      if (!fileName) {
        console.error('Please provide a filename');
        process.exit(1);
      }
      const inputPath = path.join(originDir, fileName);
      const outputPath = path.join(targetDir, fileName);
      transformer.transformComponent(inputPath, outputPath);
      break;
    }
    default:
      showHelp();
  }
}

if (require.main === module) {
  run();
}

export { ComponentTransformer };
