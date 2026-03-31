const fs = require('fs').promises;
const path = require('path');

const TEMPLATES = {
  'frontend': {
    category: 'role-based',
    name: 'Frontend Developer',
    description: 'An expert frontend developer specialized in modern JavaScript frameworks',
    path: 'role-based/frontend.md'
  },
  'backend': {
    category: 'role-based',
    name: 'Backend Developer',
    description: 'An expert backend developer specialized in server-side architecture',
    path: 'role-based/backend.md'
  },
  'fullstack': {
    category: 'role-based',
    name: 'Full-Stack Developer',
    description: 'A full-stack developer capable of building complete web applications',
    path: 'role-based/fullstack.md'
  },
  'bug-fix': {
    category: 'task-based',
    name: 'Bug Fix Expert',
    description: 'An expert in debugging and fixing software bugs',
    path: 'task-based/bug-fix.md'
  },
  'feature-dev': {
    category: 'task-based',
    name: 'Feature Developer',
    description: 'An expert in implementing new features',
    path: 'task-based/feature-dev.md'
  },
  'refactor': {
    category: 'task-based',
    name: 'Code Refactoring Expert',
    description: 'An expert in improving code quality through refactoring',
    path: 'task-based/refactor.md'
  },
  'code-review': {
    category: 'general',
    name: 'Code Reviewer',
    description: 'An expert in code review and quality assurance',
    path: 'general/code-review.md'
  },
  'testing': {
    category: 'general',
    name: 'Testing Engineer',
    description: 'An expert in writing comprehensive tests',
    path: 'general/testing.md'
  },
  'docs-gen': {
    category: 'general',
    name: 'Documentation Generator',
    description: 'An expert in creating technical documentation',
    path: 'general/docs-gen.md'
  }
};

const TEMPLATE_DIR = path.join(__dirname);

function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value
  }));
}

function getTemplateById(id) {
  return TEMPLATES[id] || null;
}

function getTemplatesByCategory(category) {
  return Object.entries(TEMPLATES)
    .filter(([_, v]) => v.category === category)
    .map(([key, value]) => ({ id: key, ...value }));
}

async function loadTemplate(id) {
  const template = TEMPLATES[id];
  if (!template) {
    throw new Error(`Template '${id}' not found`);
  }

  const templatePath = path.join(TEMPLATE_DIR, template.path);
  const content = await fs.readFile(templatePath, 'utf-8');
  
  return {
    id,
    ...template,
    content
  };
}

function applyTemplate(content, variables) {
  let result = content;
  
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, inner) => {
    const value = variables[varName];
    if (value) {
      return inner;
    }
    return '';
  });
  
  result = result.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, varName, inner) => {
    const value = variables[varName];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return inner;
    }
    return '';
  });
  
  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      if (key === 'capabilities' || key === 'constraints' || key === 'toolsList') {
        const formatted = value.map((item, index) => `${index + 1}. ${item}`).join('\n');
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, formatted || '');
      } else {
        const formatted = value.join(', ');
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, formatted || '');
      }
    } else if (typeof value === 'object') {
      continue;
    } else {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
  }
  
  return result;
}

module.exports = {
  TEMPLATES,
  listTemplates,
  getTemplateById,
  getTemplatesByCategory,
  loadTemplate,
  applyTemplate
};
