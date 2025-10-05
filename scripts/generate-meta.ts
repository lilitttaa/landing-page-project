#!/usr/bin/env tsx

import { ComponentMetaGenerator } from '../src/lib/componentMetaGenerator';
import * as path from 'path';

async function main() {
  const componentsDir = path.join(process.cwd(), 'src', 'components', 'landing-page');
  const generator = new ComponentMetaGenerator(componentsDir);
  
  console.log('🚀 Starting component meta data generation...');
  console.log(`📁 Scanning components in: ${componentsDir}`);
  
  try {
    await generator.generateAllMetaData();
    console.log('✅ Meta data generation completed successfully!');
  } catch (error) {
    console.error('❌ Error during meta data generation:', error);
    process.exit(1);
  }
}

main();