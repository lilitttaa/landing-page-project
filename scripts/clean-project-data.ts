#!/usr/bin/env tsx

import { ComponentDataValidator } from '../src/lib/componentDataValidator';
import * as fs from 'fs';
import * as path from 'path';

async function cleanProjectData() {
  console.log('🧹 Cleaning existing project data...\n');
  
  const validator = new ComponentDataValidator();
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  
  if (!fs.existsSync(projectsPath)) {
    console.log('❌ projects.json not found');
    return;
  }

  // 读取现有项目数据
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
  
  console.log(`📊 Found ${projectsData.length} projects to clean`);
  
  let cleanedCount = 0;
  
  // 清理每个项目的数据
  for (const project of projectsData) {
    if (!project.landing_page_data) continue;
    
    let hasChanges = false;
    
    // 遍历每个 block 并清理其内容
    for (const blockId of project.landing_page_data.sitemap || []) {
      const block = project.landing_page_data.blocks[blockId];
      if (!block) continue;

      const contentId = block.content;
      const content = project.landing_page_data.block_contents[contentId];
      if (!content) continue;

      try {
        const componentName = block.subtype;
        const originalContent = JSON.stringify(content);
        
        // 清理数据（只保留有效属性并合并默认值）
        const cleanedContent = validator.mergeWithDefaults(componentName, content);
        const cleanedContentStr = JSON.stringify(cleanedContent);
        
        if (originalContent !== cleanedContentStr) {
          console.log(`🔧 Cleaning ${componentName} in project ${project.id}`);
          console.log(`   Before: ${Object.keys(content).join(', ')}`);
          console.log(`   After:  ${Object.keys(cleanedContent).join(', ')}`);
          
          project.landing_page_data.block_contents[contentId] = cleanedContent;
          hasChanges = true;
        }
        
      } catch (error) {
        console.warn(`⚠️  Failed to clean ${block.subtype} in project ${project.id}:`, error);
      }
    }
    
    if (hasChanges) {
      cleanedCount++;
    }
  }
  
  // 写回清理后的数据
  fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
  
  console.log(`\n✅ Data cleaning completed!`);
  console.log(`📈 Cleaned ${cleanedCount} projects`);
}

cleanProjectData().catch(console.error);