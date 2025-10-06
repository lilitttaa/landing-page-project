import * as fs from 'fs';
import * as path from 'path';

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const LANDING_PAGE_DIR = path.join(COMPONENTS_DIR, 'landing-page');
const ORIGIN_DIR = path.join(COMPONENTS_DIR, 'landing-page-original');

/**
 * Copy components from landing-page to landing-page-original directory
 */
export async function copyToOrigin(): Promise<void> {
  try {
    // Ensure origin directory exists
    if (!fs.existsSync(ORIGIN_DIR)) {
      fs.mkdirSync(ORIGIN_DIR, { recursive: true });
    }

    // Read all files in landing-page directory
    const files = fs.readdirSync(LANDING_PAGE_DIR);
    
    for (const file of files) {
      const sourcePath = path.join(LANDING_PAGE_DIR, file);
      const targetPath = path.join(ORIGIN_DIR, file);
      
      // Only copy TypeScript/JavaScript files
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        fs.writeFileSync(targetPath, content);
        console.log(`✅ Copied ${file} to origin directory`);
      }
    }
    
    console.log(`🎉 Successfully copied all components to origin directory`);
  } catch (error) {
    console.error('❌ Error copying to origin:', error);
    throw error;
  }
}

/**
 * Copy components from landing-page-original back to landing-page directory
 */
export async function copyFromOrigin(): Promise<void> {
  try {
    if (!fs.existsSync(ORIGIN_DIR)) {
      throw new Error('Origin directory does not exist. Run copyToOrigin() first.');
    }

    // Read all files in origin directory
    const files = fs.readdirSync(ORIGIN_DIR);
    
    for (const file of files) {
      const sourcePath = path.join(ORIGIN_DIR, file);
      const targetPath = path.join(LANDING_PAGE_DIR, file);
      
      // Only copy TypeScript/JavaScript files
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(sourcePath, 'utf-8');
        fs.writeFileSync(targetPath, content);
        console.log(`✅ Restored ${file} from origin directory`);
      }
    }
    
    console.log(`🎉 Successfully restored all components from origin directory`);
  } catch (error) {
    console.error('❌ Error copying from origin:', error);
    throw error;
  }
}

/**
 * List files in both directories for comparison
 */
export function listFiles(): void {
  console.log('\n📁 Landing Page Directory:');
  if (fs.existsSync(LANDING_PAGE_DIR)) {
    const landingFiles = fs.readdirSync(LANDING_PAGE_DIR);
    landingFiles.forEach(file => console.log(`  - ${file}`));
  } else {
    console.log('  Directory does not exist');
  }

  console.log('\n📁 Origin Directory:');
  if (fs.existsSync(ORIGIN_DIR)) {
    const originFiles = fs.readdirSync(ORIGIN_DIR);
    originFiles.forEach(file => console.log(`  - ${file}`));
  } else {
    console.log('  Directory does not exist');
  }
}

// CLI functionality
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'to-origin':
      copyToOrigin();
      break;
    case 'from-origin':
      copyFromOrigin();
      break;
    case 'list':
      listFiles();
      break;
    default:
      console.log(`
📝 Component Copy Manager
Usage: npm run copy-components [command]

Commands:
  to-origin     Copy components from landing-page to landing-page-original
  from-origin   Copy components from landing-page-original to landing-page
  list          List files in both directories

Examples:
  npm run copy-components to-origin
  npm run copy-components from-origin
  npm run copy-components list
      `);
  }
}