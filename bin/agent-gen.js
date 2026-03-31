#!/usr/bin/env node

const path = require('path');
const { parseArgs } = require('util');
const { generateAgentMd } = require('../src/index');
const { listTemplates, getTemplateById } = require('../src/templates');
const { loadProjectConfig } = require('../src/project-config');

const options = {
  config: {
    type: 'string',
    short: 'c'
  },
  output: {
    type: 'string',
    short: 'o'
  },
  template: {
    type: 'string',
    short: 't'
  },
  project: {
    type: 'string',
    short: 'p'
  },
  'auto-read': {
    type: 'boolean'
  },
  'auto-detect': {
    type: 'boolean',
    short: 'a'
  },
  'list-templates': {
    type: 'boolean'
  },
  help: {
    type: 'boolean',
    short: 'h'
  }
};

function printHelp() {
  const templates = listTemplates();
  const categories = ['role-based', 'task-based', 'general'];
  
  let templateList = '\nAvailable Templates:\n';
  categories.forEach(cat => {
    templateList += `\n  [${cat.toUpperCase()}]\n`;
    templates.filter(t => t.category === cat).forEach(t => {
      templateList += `    ${t.id.padEnd(12)} - ${t.description}\n`;
    });
  });

  console.log(`
 Usage: agent-gen [options]

 Options:
   -c, --config <file>      Path to JSON configuration file
   -o, --output <path>      Output path for agent.md (default: ./agent.md)
   -t, --template <name>    Use a preset template
   -p, --project <path>     Project directory to read config from (default: cwd)
   -a, --auto-detect        Auto-detect and read project config (Node.js/Python/Go/Rust)
       --auto-read          Auto-read project config without prompting
       --list-templates     List all available templates
   -h, --help              Show this help message

 Examples:
   agent-gen                           # Interactive mode
   agent-gen -t frontend               # Use frontend template
   agent-gen -a                        # Auto-detect project and generate
   agent-gen -a -t bug-fix             # Auto-detect + template
   agent-gen -c config.json            # Use config file
   agent-gen -t bug-fix -o ./docs/    # Custom template and output
  ${templateList}
 `);
}

function printTemplates() {
  const templates = listTemplates();
  const categories = ['role-based', 'task-based', 'general'];
  
  console.log('\nAvailable Templates:\n');
  categories.forEach(cat => {
    console.log(`[${cat.toUpperCase()}]`);
    templates.filter(t => t.category === cat).forEach(t => {
      console.log(`  ${t.id.padEnd(12)} - ${t.description}`);
    });
    console.log('');
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--list-templates')) {
    printTemplates();
    process.exit(0);
  }

  let parsedArgs = {};
  try {
    parsedArgs = parseArgs({ options, allowPositionals: false }).values;
  } catch (e) {
    console.error('Error parsing arguments:', e.message);
    printHelp();
    process.exit(1);
  }

  if (parsedArgs.template && !getTemplateById(parsedArgs.template)) {
    console.error(`Error: Template '${parsedArgs.template}' not found.`);
    console.error('Use --list-templates to see all available templates.');
    process.exit(1);
  }

  const configPath = parsedArgs.config || null;
  const outputPath = parsedArgs.output || path.join(process.cwd(), 'agent.md');
  const templateId = parsedArgs.template || null;
  const autoDetect = parsedArgs.autoDetect || false;
  
  let projectConfig = null;
  const projectPath = parsedArgs.project || process.cwd();
  const autoRead = parsedArgs.autoRead || false;

  async function loadAndDisplayProjectConfig(path, reason) {
    try {
      const config = await loadProjectConfig(path);
      if (config) {
        console.log(`📁 Project: ${config.packageJson.name}`);
        console.log(`🛠️  Tech stack: ${config.packageJson.frameworks.join(', ') || 'N/A'}`);
        console.log(`🔧 Tools: ${config.packageJson.tools.join(', ') || 'N/A'}`);
        
        if (config.hasTypeScript) console.log(`✅ TypeScript detected`);
        if (config.hasTestConfig) console.log(`✅ Test framework detected`);
        if (config.hasBuildConfig) console.log(`✅ Build tool detected`);
        
        if (config.projectType) {
          console.log(`📦 Project type: ${config.projectType}`);
        }
        
        console.log('');
        return config;
      } else {
        console.log(`⚠️  No project config found in ${path} (${reason})`);
        return null;
      }
    } catch (error) {
      console.warn(`⚠️  Failed to read project config: ${error.message}`);
      return null;
    }
  }

  if (templateId) {
    console.log(`📋 Using template: ${templateId}`);
    projectConfig = await loadAndDisplayProjectConfig(projectPath, 'template mode');
  } else if (autoDetect) {
    console.log(`🔍 Auto-detecting project config...`);
    const detectedConfig = await loadAndDisplayProjectConfig(projectPath, 'auto-detect mode');
    
    if (detectedConfig && !templateId) {
      const { projectType, packageJson } = detectedConfig;
      const frameworks = packageJson.frameworks || [];
      const tools = packageJson.tools || [];
      
      let autoTemplateId = null;
      
      if (projectType === 'node' || projectType === 'python') {
        if (frameworks.includes('react') || frameworks.includes('vue') || frameworks.includes('angular') || frameworks.includes('svelte')) {
          autoTemplateId = 'frontend';
        } else if (frameworks.includes('express') || frameworks.includes('nest') || frameworks.includes('django') || frameworks.includes('flask') || frameworks.includes('fastapi') || frameworks.includes('gin')) {
          autoTemplateId = 'backend';
        }
      } else if (projectType === 'go' || projectType === 'rust') {
        autoTemplateId = 'backend';
      }
      
      if (autoTemplateId) {
        console.log(`🤖 Auto-selected template: ${autoTemplateId} based on project type`);
        templateId = autoTemplateId;
        projectConfig = detectedConfig;
      }
    }
  }

  try {
    const result = await generateAgentMd(configPath, outputPath, templateId, projectConfig);
    console.log(`\n✅ Agent.md generated successfully at: ${result}`);
  } catch (error) {
    console.error('Error generating Agent.md:', error.message);
    process.exit(1);
  }
}

main();
