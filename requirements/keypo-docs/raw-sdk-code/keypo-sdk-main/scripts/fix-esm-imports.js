import fs from 'fs';
import path from 'path';

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add .js extension to relative imports that don't already have it
      content = content.replace(
        /from ['"](\.[^'"]*)['"]/g,
        (match, importPath) => {
          if (importPath.endsWith('.js')) {
            return match;
          }
          return `from '${importPath}.js'`;
        }
      );
      
      fs.writeFileSync(filePath, content);
    }
  }
}

// Run the fix on the ESM directory
const esmDir = path.join(process.cwd(), 'dist', 'esm');
if (fs.existsSync(esmDir)) {
  addJsExtensions(esmDir);
  console.log('Fixed ESM import extensions');
} 