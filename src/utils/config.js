const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');

function getConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading config file:', err);
    return {};
  }
}

module.exports = { getConfig };
