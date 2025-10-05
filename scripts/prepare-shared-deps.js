const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function prepareSharedDependencies() {
  const templatePath = path.join(__dirname, '..', 'template');
  const sharedNodeModulesPath = path.join(templatePath, 'node_modules');
  
  console.log('🚀 Preparing shared dependencies for faster deployments...');
  
  // 检查是否已经存在
  if (fs.existsSync(sharedNodeModulesPath)) {
    console.log('✅ Shared dependencies already exist');
    return;
  }
  
  // 检查template目录是否存在
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template directory not found:', templatePath);
    process.exit(1);
  }
  
  // 在template目录中安装依赖
  try {
    console.log('📦 Installing dependencies in template directory...');
    await runCommand('npm install --prefer-offline --no-audit --no-fund', templatePath);
    console.log('✅ Shared dependencies installed successfully!');
    console.log('🎯 Future deployments will be much faster');
  } catch (error) {
    console.error('❌ Failed to install shared dependencies:', error);
    process.exit(1);
  }
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const [cmd, ...args] = command.split(' ');
    const actualCmd = isWindows ? 'cmd' : cmd;
    const actualArgs = isWindows ? ['/c', command] : args;
    
    const child = spawn(actualCmd, actualArgs, {
      cwd,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 运行脚本
prepareSharedDependencies().catch(console.error);