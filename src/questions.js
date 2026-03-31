const inquirer = require('inquirer').default;
const { listTemplates, loadTemplate, applyTemplate } = require('./templates');
const fs = require('fs').promises;
const path = require('path');
const { inferCapabilities, inferTools, inferWorkflow, inferConstraints } = require('./project-config');

function buildProjectDefaults(projectConfig) {
  if (!projectConfig?.packageJson) return {};
  
  const { packageJson } = projectConfig;
  const capabilities = inferCapabilities(projectConfig);
  const tools = inferTools(projectConfig);
  const workflow = inferWorkflow(projectConfig);
  const constraints = inferConstraints(projectConfig);

  return {
    name: packageJson.name || 'My Agent',
    description: packageJson.description || '',
    role: `You are an expert ${packageJson.frameworks.join('/') || 'developer'} developer.`,
    capabilities: capabilities,
    constraints: constraints,
    workflow: workflow,
    tools: tools,
    outputFormat: 'Provide clear, concise responses with code examples. Summarize changes made.'
  };
}

async function askQuestions(config = {}, projectConfig = null) {
  const templates = listTemplates();
  
  const projectDefaults = buildProjectDefaults(projectConfig);
  const mergedConfig = { ...config, ...projectDefaults };

  if (!projectConfig && !config._askedTemplate) {
    const modeQuestion = {
      type: 'list',
      name: 'mode',
      message: 'Select creation mode:',
      choices: [
        { name: 'Use preset template', value: 'template' },
        { name: 'Start from scratch (full interactive)', value: 'interactive' }
      ],
      default: 'template'
    };

    const modeAnswer = await inquirer.prompt([modeQuestion]);

    if (modeAnswer.mode === 'template') {
      return await selectTemplate(mergedConfig, projectConfig);
    }

    return await fullInteractive(mergedConfig);
  }

  if (projectConfig) {
    return await fullInteractive(mergedConfig);
  }

  return await fullInteractive(config);
}

async function selectTemplate(config = {}, projectConfig = null) {
  const templates = listTemplates();
  const categories = ['role-based', 'task-based', 'general'];
  
  const choices = [];
  categories.forEach(cat => {
    const catTemplates = templates.filter(t => t.category === cat);
    if (catTemplates.length > 0) {
      choices.push(new inquirer.Separator(`=== ${cat.toUpperCase()} ===`));
      catTemplates.forEach(t => {
        choices.push({
          name: `${t.id.padEnd(12)} - ${t.description}`,
          value: t.id
        });
      });
    }
  });

  const templateQuestion = {
    type: 'list',
    name: 'templateId',
    message: 'Select a template:',
    choices
  };

  const templateAnswer = await inquirer.prompt([templateQuestion]);
  
  const template = await loadTemplate(templateAnswer.templateId);
  
  return {
    isTemplate: true,
    templateId: templateAnswer.templateId,
    templateName: template.name,
    templateDescription: template.description,
    content: template.content
  };
}

async function fullInteractive(config = {}) {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Agent name:',
      default: config.name || 'My Agent',
      validate: (input) => input.trim() !== '' || 'Name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Brief description:',
      default: config.description || ''
    },
    {
      type: 'editor',
      name: 'role',
      message: 'Role & Identity (describe the agent\'s purpose and persona):',
      default: config.role || 'You are an AI agent that helps with software development tasks.',
      validate: (input) => input.trim() !== '' || 'Role is required'
    },
    {
      type: 'editor',
      name: 'capabilities',
      message: 'Capabilities (one per line, will be numbered):',
      default: (config.capabilities || []).join('\n') || 'Write and modify code\nDebug and fix issues\nRun commands and tests\nRead and analyze files'
    },
    {
      type: 'editor',
      name: 'constraints',
      message: 'Constraints (one per line, will be numbered):',
      default: (config.constraints || []).join('\n') || 'Always verify before making changes\nNever modify files without user consent\nFollow security best practices'
    },
    {
      type: 'editor',
      name: 'workflow',
      message: 'Workflow (how the agent should approach tasks):',
      default: config.workflow || '1. Understand the task\n2. Analyze existing code\n3. Plan the approach\n4. Implement the solution\n5. Verify the result'
    },
    {
      type: 'editor',
      name: 'tools',
      message: 'Tools (one per line, leave empty for none):',
      default: (config.tools || []).join('\n') || 'File read/write\nCommand execution\ngrep/search'
    },
    {
      type: 'editor',
      name: 'outputFormat',
      message: 'Output Format (how should the agent present results):',
      default: config.outputFormat || 'Provide clear, concise responses. Include code examples when relevant. Summarize changes made.'
    }
  ];

  const answers = await inquirer.prompt(questions);

  answers.capabilities = answers.capabilities
    .split('\n')
    .map(c => c.trim())
    .filter(c => c !== '');

  answers.constraints = answers.constraints
    .split('\n')
    .map(c => c.trim())
    .filter(c => c !== '');

  answers.tools = answers.tools
    .split('\n')
    .map(t => t.trim())
    .filter(t => t !== '');

  return answers;
}

module.exports = { askQuestions };
