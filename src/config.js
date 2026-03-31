const fs = require('fs').promises;
const path = require('path');

async function loadConfig(configPath) {
  const ext = path.extname(configPath).toLowerCase();
  const content = await fs.readFile(configPath, 'utf-8');

  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.js') {
    return require(path.resolve(configPath));
  } else {
    throw new Error('Unsupported config file format. Use .json or .js');
  }
}

module.exports = { loadConfig };
