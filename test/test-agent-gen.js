const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const outputDir = path.join(testDir, 'output');
const templates = ['docs-gen', 'testing', 'code-review', 'refactor', 'feature-dev', 'bug-fix', 'frontend', 'backend', 'fullstack'];

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

console.log('=== 测试 agent-gen 技术栈输出 ===\n');

templates.forEach(template => {
  const outputPath = path.join(outputDir, `agent-${template}.md`);
  console.log(`正在生成: ${template}...`);
  
  try {
    execSync(`node ../bin/agent-gen.js -a -t ${template} -o ${outputPath}`, {
      cwd: testDir,
      stdio: 'pipe'
    });
    
    const content = fs.readFileSync(outputPath, 'utf-8');
    const hasTechStack = content.includes('Tech Stack') || content.includes('techStack');
    const hasProjectName = content.includes('health-passport');
    const hasFrameworks = content.includes('react') || content.includes('next');
    
    console.log(`  ✅ 生成成功`);
    console.log(`     - Tech Stack 章节: ${hasTechStack ? '✓' : '✗'}`);
    console.log(`     - 包含项目名: ${hasProjectName ? '✓' : '✗'}`);
    console.log(`     - 包含框架信息: ${hasFrameworks ? '✓' : '✗'}`);
    
  } catch (error) {
    console.log(`  ❌ 生成失败: ${error.message}`);
  }
  console.log('');
});

console.log('=== 输出文件 ===');
fs.readdirSync(outputDir).forEach(file => {
  const filePath = path.join(outputDir, file);
  const stats = fs.statSync(filePath);
  console.log(`${file} (${stats.size} bytes)`);
});