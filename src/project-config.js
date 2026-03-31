const fs = require('fs').promises;
const path = require('path');

const FRAMEWORKS = {
  react: ['react', 'react-dom', 'next'],
  vue: ['vue', '@vue/core', 'nuxt'],
  angular: ['@angular/core', '@angular/common'],
  svelte: ['svelte', '@sveltejs/kit'],
  express: ['express', 'fastify', 'koa', 'nest'],
  nest: ['@nestjs/core', '@nestjs/common'],
  electron: ['electron'],
  django: ['django'],
  flask: ['flask'],
  fastapi: ['fastapi'],
  spring: ['spring-boot'],
  gofiber: ['gofiber'],
  gin: ['gin'],
  rocket: ['rocket'],
  actixweb: ['actix-web']
};

const DEV_TOOLS = {
  typescript: ['typescript'],
  eslint: ['eslint'],
  prettier: ['prettier'],
  tailwindcss: ['tailwindcss'],
  vuetify: ['vuetify'],
  materialui: ['@mui/material', '@material-ui/core'],
  bootstrap: ['bootstrap', 'react-bootstrap'],
  styledcomponents: ['styled-components'],
  sass: ['sass', 'node-sass'],
  less: ['less'],
  webpack: ['webpack', 'webpack-cli'],
  vite: ['vite', '@vitejs/plugin-react', '@vitejs/plugin-vue'],
  rollup: ['rollup'],
  jest: ['jest', '@types/jest'],
  vitest: ['vitest', '@vitest/ui'],
  cypress: ['cypress'],
  playwright: ['@playwright/test'],
  mocha: ['mocha', '@types/mocha'],
  chai: ['chai'],
  storybook: ['@storybook/react', '@storybook/vue', '@storybook/angular'],
  pytest: ['pytest'],
  black: ['black'],
  flake8: ['flake8'],
  mypy: ['mypy'],
  poetry: ['poetry'],
  pipenv: ['pipenv'],
  cargo: ['cargo'],
  rustfmt: ['rustfmt'],
  clippy: ['clippy']
};

const BUILD_SCRIPTS = ['dev', 'develop', 'serve', 'start', 'build', 'compile'];
const TEST_SCRIPTS = ['test', 'test:watch', 'test:coverage', 'coverage', 'lint', 'typecheck'];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function readPackageJson(projectPath) {
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = await readJsonFile(pkgPath);
  
  if (!pkg) return null;

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const frameworks = detectFrameworks(allDeps);
  const tools = detectTools(allDeps);
  const scripts = extractScripts(pkg.scripts);

  return {
    name: pkg.name || 'My Project',
    description: pkg.description || '',
    version: pkg.version || '',
    frameworks,
    tools,
    scripts,
    packageManager: detectPackageManager(pkg)
  };
}

function detectFrameworks(deps) {
  const detected = [];
  
  for (const [category, names] of Object.entries(FRAMEWORKS)) {
    if (names.some(name => deps[name])) {
      detected.push(category);
    }
  }
  
  return detected;
}

function detectTools(deps) {
  const detected = [];
  
  for (const [tool, names] of Object.entries(DEV_TOOLS)) {
    if (names.some(name => deps[name])) {
      detected.push(tool);
    }
  }
  
  return detected;
}

function extractScripts(scripts = {}) {
  const result = {
    build: [],
    test: [],
    dev: [],
    lint: [],
    other: []
  };

  for (const [name, cmd] of Object.entries(scripts)) {
    const lowerName = name.toLowerCase();
    
    if (BUILD_SCRIPTS.some(s => lowerName.includes(s))) {
      result.build.push({ name, command: cmd });
    } else if (TEST_SCRIPTS.some(s => lowerName.includes(s))) {
      result.test.push({ name, command: cmd });
    } else if (lowerName.includes('dev') || lowerName.includes('start') || lowerName.includes('serve')) {
      result.dev.push({ name, command: cmd });
    } else if (lowerName.includes('lint')) {
      result.lint.push({ name, command: cmd });
    } else {
      result.other.push({ name, command: cmd });
    }
  }

  return result;
}

function detectPackageManager(pkg) {
  if (pkg.packageManager) {
    return pkg.packageManager.split('@')[0];
  }
  if (pkg.engines?.npm) return 'npm';
  if (pkg.engines?.yarn) return 'yarn';
  if (pkg.engines?.pnpm) return 'pnpm';
  return 'npm';
}

async function readTsConfig(projectPath) {
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  const tsconfig = await readJsonFile(tsconfigPath);

  if (!tsconfig) return null;

  return {
    compilerOptions: tsconfig.compilerOptions || {},
    extends: tsconfig.extends || null,
    isJsx: tsconfig.compilerOptions?.jsx,
    isStrict: tsconfig.compilerOptions?.strict,
    outDir: tsconfig.compilerOptions?.outDir
  };
}

async function readBuildConfig(projectPath) {
  const configs = [
    'vite.config.js', 'vite.config.ts', 'vite.config.mjs',
    'webpack.config.js', 'webpack.config.ts',
    'rollup.config.js', 'rollup.config.ts',
    'esbuild.config.js'
  ];

  for (const configFile of configs) {
    const configPath = path.join(projectPath, configFile);
    if (await fileExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      return {
        file: configFile,
        type: configFile.includes('vite') ? 'vite' : 
              configFile.includes('webpack') ? 'webpack' :
              configFile.includes('rollup') ? 'rollup' : 'esbuild',
        content: content.substring(0, 500)
      };
    }
  }

  return null;
}

async function readTestConfig(projectPath) {
  const configs = [
    'jest.config.js', 'jest.config.ts', 'jest.config.json',
    'vitest.config.js', 'vitest.config.ts',
    '.jestrc', '.jestrc.json'
  ];

  for (const configFile of configs) {
    const configPath = path.join(projectPath, configFile);
    if (await fileExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      return {
        file: configFile,
        type: configFile.includes('vitest') ? 'vitest' : 'jest',
        content: content.substring(0, 500)
      };
    }
  }

  return null;
}

async function loadProjectConfig(projectPath = process.cwd()) {
  const [packageJson, tsconfig, buildConfig, testConfig] = await Promise.all([
    readPackageJson(projectPath),
    readTsConfig(projectPath),
    readBuildConfig(projectPath),
    readTestConfig(projectPath)
  ]);

  if (!packageJson) {
    return null;
  }

  return {
    projectPath,
    packageJson,
    tsconfig,
    buildConfig,
    testConfig,
    hasTypeScript: !!tsconfig,
    hasTestConfig: !!testConfig,
    hasBuildConfig: !!buildConfig
  };
}

function inferCapabilities(config) {
  const caps = [];
  const { packageJson } = config;
  const { frameworks, tools, scripts } = packageJson;

  if (frameworks.includes('react')) {
    caps.push('Build React applications');
    caps.push('Implement React components and hooks');
    if (frameworks.includes('next')) {
      caps.push('Build Next.js applications with SSR/SSG');
    }
  }
  if (frameworks.includes('vue')) {
    caps.push('Build Vue.js applications');
    caps.push('Implement Vue components and composition API');
  }
  if (frameworks.includes('angular')) {
    caps.push('Build Angular applications');
    caps.push('Implement Angular components and services');
  }
  if (frameworks.includes('express') || frameworks.includes('nest')) {
    caps.push('Build RESTful APIs');
    caps.push('Implement backend services and middleware');
  }
  if (frameworks.includes('django')) {
    caps.push('Build Django applications');
    caps.push('Implement Django models, views, and templates');
  }
  if (frameworks.includes('flask')) {
    caps.push('Build Flask applications');
    caps.push('Implement Flask routes and blueprints');
  }
  if (frameworks.includes('fastapi')) {
    caps.push('Build FastAPI applications');
    caps.push('Implement RESTful APIs with automatic documentation');
  }
  if (frameworks.includes('gin') || frameworks.includes('gofiber')) {
    caps.push('Build Go web applications');
    caps.push('Implement Go RESTful APIs');
  }
  if (frameworks.includes('rocket') || frameworks.includes('actixweb')) {
    caps.push('Build Rust web applications');
    caps.push('Implement Rust APIs with async runtime');
  }

  if (tools.includes('typescript')) {
    caps.push('Write type-safe TypeScript code');
  }
  if (tools.includes('jest') || tools.includes('vitest')) {
    caps.push('Write and run unit tests');
  }
  if (tools.includes('cypress') || tools.includes('playwright')) {
    caps.push('Write end-to-end tests');
  }
  if (tools.includes('eslint') || tools.includes('prettier')) {
    caps.push('Follow code quality standards');
  }
  if (tools.includes('pytest')) {
    caps.push('Write and run Python unit tests');
  }
  if (tools.includes('black') || tools.includes('flake8') || tools.includes('mypy')) {
    caps.push('Follow Python code quality standards');
  }
  if (tools.includes('cargo') || tools.includes('rustc')) {
    caps.push('Build and manage Rust projects');
  }

  return caps;
}

function inferTools(config) {
  const tools = ['File read/write', 'Command execution'];
  const { packageJson, projectType } = config;
  const { tools: detectedTools, scripts, packageManager } = packageJson;

  if (detectedTools.includes('typescript')) {
    tools.push('TypeScript compilation');
  }
  if (detectedTools.includes('eslint')) {
    tools.push('ESLint linting');
  }
  if (detectedTools.includes('jest') || detectedTools.includes('vitest')) {
    tools.push('Test execution (npm test)');
  }
  if (detectedTools.includes('cypress')) {
    tools.push('Cypress E2E testing');
  }
  if (detectedTools.includes('playwright')) {
    tools.push('Playwright E2E testing');
  }

  if (detectedTools.includes('pytest')) {
    tools.push('Pytest test execution');
  }
  if (detectedTools.includes('black')) {
    tools.push('Black code formatting');
  }
  if (detectedTools.includes('mypy')) {
    tools.push('MyPy type checking');
  }
  if (detectedTools.includes('cargo')) {
    tools.push('Cargo build and test');
  }

  if (packageManager) {
    tools.push(`Package manager: ${packageManager}`);
  } else if (projectType === 'python') {
    tools.push('Package manager: pip/poetry');
  } else if (projectType === 'go') {
    tools.push('Package manager: go mod');
  } else if (projectType === 'rust') {
    tools.push('Package manager: cargo');
  }

  return tools;
}

function inferWorkflow(config) {
  const { packageJson, hasTypeScript, hasTestConfig } = config;
  const { scripts, tools } = packageJson;

  const steps = [
    '1. Understand the requirements and specifications',
    '2. Analyze existing codebase structure'
  ];

  if (hasTypeScript || tools.includes('typescript')) {
    steps.push('3. Check TypeScript configuration and types');
  }

  steps.push('3. Implement the solution with proper error handling');

  if (scripts.test?.length > 0) {
    steps.push('4. Run tests to verify the implementation');
  } else {
    steps.push('4. Verify the implementation works correctly');
  }

  steps.push('5. Ensure code follows project conventions');

  return steps.join('\n');
}

function inferConstraints(config) {
  const constraints = [
    'Always verify changes before committing',
    'Never modify files without user consent',
    'Follow existing code style and conventions',
    'Keep changes focused and minimal'
  ];

  const { hasTypeScript } = config;

  if (hasTypeScript) {
    constraints.push('Maintain type safety and avoid `any` type');
  }

  return constraints;
}

async function detectProjectType(projectPath) {
  const files = await fs.readdir(projectPath);
  
  if (files.includes('package.json')) return 'node';
  if (files.includes('pyproject.toml') || files.includes('setup.py') || files.includes('requirements.txt')) return 'python';
  if (files.includes('go.mod')) return 'go';
  if (files.includes('Cargo.toml')) return 'rust';
  if (files.includes('pom.xml') || files.includes('build.gradle')) return 'java';
  if (files.some(f => f.endsWith('.csproj')) || files.includes('*.sln')) return 'csharp';
  
  return null;
}

async function readPythonProject(projectPath) {
  const configs = [
    { file: 'pyproject.toml', type: 'toml' },
    { file: 'setup.py', type: 'python' },
    { file: 'requirements.txt', type: 'txt' }
  ];

  let name = path.basename(projectPath);
  let description = '';
  let dependencies = [];
  let devDependencies = [];

  for (const config of configs) {
    const configPath = path.join(projectPath, config.file);
    if (await fileExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf-8');
      
      if (config.file === 'pyproject.toml') {
        try {
          const toml = parseToml(content);
          if (toml.project) {
            name = toml.project.name || name;
            description = toml.project.description || '';
            dependencies = toml.project.dependencies || [];
            devDependencies = toml.project.optionalDependencies || [];
          }
        } catch {}
      } else if (config.file === 'setup.py') {
        const match = content.match(/name\s*=\s*['"]([^'"]+)['"]/);
        if (match) name = match[1];
        const descMatch = content.match(/description\s*=\s*['"]([^'"]+)['"]/);
        if (descMatch) description = descMatch[1];
      } else if (config.file === 'requirements.txt') {
        dependencies = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      }
      break;
    }
  }

  const frameworks = detectPythonFrameworks(dependencies);
  const tools = detectPythonTools(dependencies, devDependencies);

  return {
    name,
    description,
    frameworks,
    tools,
    scripts: {}
  };
}

async function readGoProject(projectPath) {
  const goModPath = path.join(projectPath, 'go.mod');
  const content = await fs.readFile(goModPath, 'utf-8');
  
  const nameMatch = content.match(/module\s+([^\s]+)/);
  const goVersionMatch = content.match(/go\s+(\d+\.\d+)/);
  
  const name = nameMatch ? nameMatch[1].split('/').pop() : path.basename(projectPath);
  const goVersion = goVersionMatch ? goVersionMatch[1] : '';
  
  const frameworks = detectGoFrameworks(content);
  const tools = [];
  
  if (goVersion) tools.push(`Go ${goVersion}`);
  
  return {
    name,
    description: '',
    frameworks,
    tools,
    scripts: {}
  };
}

async function readRustProject(projectPath) {
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  const content = await fs.readFile(cargoPath, 'utf-8');
  
  const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
  const descriptionMatch = content.match(/description\s*=\s*"([^"]+)"/);
  
  const name = nameMatch ? nameMatch[1] : path.basename(projectPath);
  const description = descriptionMatch ? descriptionMatch[1] : '';
  
  const frameworks = detectRustFrameworks(content);
  const tools = ['cargo', 'rustc'];
  
  return {
    name,
    description,
    frameworks,
    tools,
    scripts: {}
  };
}

function parseToml(content) {
  const result = {};
  let currentSection = null;
  let currentKey = '';
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = result[currentSection] || {};
      continue;
    }
    
    if (currentSection && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      result[currentSection][key.trim()] = value;
    }
  }
  
  return result;
}

function detectPythonFrameworks(deps) {
  const detected = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('django')) detected.push('django');
  if (depStr.includes('flask')) detected.push('flask');
  if (depStr.includes('fastapi')) detected.push('fastapi');
  if (depStr.includes('fastapi')) detected.push('fastapi');
  
  return detected;
}

function detectPythonTools(deps, devDeps) {
  const detected = [];
  const allDeps = [...deps, ...devDeps].join(' ').toLowerCase();
  
  if (allDeps.includes('pytest')) detected.push('pytest');
  if (allDeps.includes('black')) detected.push('black');
  if (allDeps.includes('flake8')) detected.push('flake8');
  if (allDeps.includes('mypy')) detected.push('mypy');
  if (allDeps.includes('poetry')) detected.push('poetry');
  if (allDeps.includes('pipenv')) detected.push('pipenv');
  
  return detected;
}

function detectGoFrameworks(content) {
  const detected = [];
  
  if (content.includes('github.com/gin-gonic/gin')) detected.push('gin');
  if (content.includes('github.com/gofiber/fiber')) detected.push('gofiber');
  if (content.includes('github.com/gin-gonic/gin')) detected.push('gin');
  if (content.includes('github.com/labstack/echo')) detected.push('echo');
  
  return detected;
}

function detectRustFrameworks(content) {
  const detected = [];
  
  if (content.includes('rocket')) detected.push('rocket');
  if (content.includes('actix-web')) detected.push('actixweb');
  if (content.includes('warp')) detected.push('warp');
  
  return detected;
}

async function loadProjectConfig(projectPath = process.cwd()) {
  const projectType = await detectProjectType(projectPath);
  
  let packageJson = null;
  
  if (projectType === 'node') {
    packageJson = await readPackageJson(projectPath);
  } else if (projectType === 'python') {
    packageJson = await readPythonProject(projectPath);
  } else if (projectType === 'go') {
    packageJson = await readGoProject(projectPath);
  } else if (projectType === 'rust') {
    packageJson = await readRustProject(projectPath);
  }
  
  if (!packageJson) {
    return null;
  }

  const [tsconfig, buildConfig, testConfig] = await Promise.all([
    projectType === 'node' ? readTsConfig(projectPath) : Promise.resolve(null),
    projectType === 'node' ? readBuildConfig(projectPath) : Promise.resolve(null),
    projectType === 'node' ? readTestConfig(projectPath) : Promise.resolve(null)
  ]);

  return {
    projectPath,
    projectType,
    packageJson,
    tsconfig,
    buildConfig,
    testConfig,
    hasTypeScript: !!tsconfig,
    hasTestConfig: !!testConfig,
    hasBuildConfig: !!buildConfig
  };
}

module.exports = {
  loadProjectConfig,
  inferCapabilities,
  inferTools,
  inferWorkflow,
  inferConstraints,
  detectProjectType
};
