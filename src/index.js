const fs = require('fs').promises;
const path = require('path');
const { generateTemplate } = require('./template');
const { loadConfig } = require('./config');
const { askQuestions } = require('./questions');
const { loadTemplate, applyTemplate, getTemplateById } = require('./templates');
const { inferCapabilities, inferTools, inferWorkflow, inferConstraints } = require('./project-config');

async function generateAgentMd(configPath, outputPath, templateId, projectConfig = null) {
  let config = {};

  if (templateId) {
    const template = await loadTemplate(templateId);
    console.log(`📋 Using template: ${template.name}`);
    
    const projectVars = projectConfig ? {
      projectName: projectConfig.packageJson.name,
      description: projectConfig.packageJson.description,
      techStack: projectConfig.packageJson.frameworks.join(', '),
      tools: projectConfig.packageJson.tools.join(', '),
      capabilities: inferCapabilities(projectConfig),
      toolsList: inferTools(projectConfig),
      workflow: inferWorkflow(projectConfig),
      constraints: inferConstraints(projectConfig),
      hasTypeScript: projectConfig.hasTypeScript,
      hasTest: projectConfig.hasTestConfig,
      hasBuild: projectConfig.hasBuildConfig,
      scripts: projectConfig.packageJson.scripts
    } : {};
    
    const templateVars = {
      ...projectVars,
      name: projectConfig?.packageJson.name || template.name,
      description: projectConfig?.packageJson.description || template.description
    };
    
    const markdown = applyTemplate(template.content, templateVars);
    
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    return outputPath;
  }

  if (configPath) {
    try {
      config = await loadConfig(configPath);
      console.log('📁 Loaded configuration from:', configPath);
    } catch (error) {
      console.warn('⚠️  Failed to load config, using interactive mode:', error.message);
    }
  }

  const answers = await askQuestions(config, projectConfig);

  if (answers.isTemplate) {
    console.log(`📋 Using template: ${answers.templateName}`);
    
    const projectVars = projectConfig?.packageJson ? {
      projectName: projectConfig.packageJson.name,
      description: projectConfig.packageJson.description,
      techStack: projectConfig.packageJson.frameworks.join(', '),
      tools: projectConfig.packageJson.tools.join(', '),
      capabilities: inferCapabilities(projectConfig),
      toolsList: inferTools(projectConfig),
      workflow: inferWorkflow(projectConfig),
      constraints: inferConstraints(projectConfig),
      scripts: projectConfig.packageJson.scripts
    } : {};

    const templateVars = {
      ...projectVars,
      name: projectConfig?.packageJson?.name || answers.templateName,
      description: projectConfig?.packageJson?.description || answers.templateDescription
    };
    
    const markdown = applyTemplate(answers.content, templateVars);
    
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, markdown, 'utf-8');
    
    return outputPath;
  }

  const markdown = generateTemplate(answers);

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf-8');

  return outputPath;
}

module.exports = { generateAgentMd };
