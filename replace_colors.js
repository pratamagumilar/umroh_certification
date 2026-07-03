const fs = require('fs');
const path = require('path');

const replacements = {
  // Blue -> Sage Green
  '#f0f9ff': '#f4f6f4',
  '#e0f2fe': '#e9eee8',
  '#bae6fd': '#d3dcd2',
  '#0ea5e9': '#789276',
  '#0369a1': '#596d58',
  '#075985': '#475746',
  
  // Rose -> Warm Sand/Gold
  '#ffe4e6': '#f5eedb',
  '#fecdd3': '#ebddc2',
  '#fb7185': '#e0c59a',
  '#f43f5e': '#d4b886',
  '#be123c': '#ab9267',
  '#9f1239': '#8c7855',

  // Slate -> Warmer Slate/Sage Dark
  '#f8fafc': '#faf9f6',
  '#e2e8f0': '#e8e6df',
  '#94a3b8': '#a3aca4',
  '#64748b': '#78867a',
  '#475569': '#5c6b5e',
  '#334155': '#425045',
  '#1e293b': '#2c352d',
  '#0f172a': '#1a201b',
};

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const [oldColor, newColor] of Object.entries(replacements)) {
    // case insensitive replace
    const regex = new RegExp(oldColor, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, newColor);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated colors in ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      replaceColorsInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Color replacement complete!');
