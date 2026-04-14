// Setup verification script
import fs from 'fs';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

console.log('🔍 Verifying Startup Radar Frontend Setup...\n');

// Check required files
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/App.css',
  'src/index.css'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json content
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('\n📦 Package.json analysis:');
  console.log(`   Name: ${packageJson.name}`);
  console.log(`   Type: ${packageJson.type}`);
  console.log(`   React: ${packageJson.dependencies?.react || 'Not found'}`);
  console.log(`   React-DOM: ${packageJson.dependencies?.['react-dom'] || 'Not found'}`);
  console.log(`   Vite: ${packageJson.devDependencies?.vite || 'Not found'}`);
  console.log(`   TypeScript: ${packageJson.devDependencies?.typescript || 'Not found'}`);
} catch (e) {
  console.log('\n❌ Error reading package.json:', e.message);
}

// Check TypeScript config
try {
  const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
  console.log('\n⚙️  TypeScript configuration:');
  console.log(`   JSX: ${tsConfig.compilerOptions?.jsx || 'Not set'}`);
  console.log(`   Strict mode: ${tsConfig.compilerOptions?.strict || 'Not set'}`);
} catch (e) {
  console.log('\n❌ Error reading tsconfig.json:', e.message);
}

// Check Vite config
try {
  const viteConfig = fs.readFileSync('./vite.config.ts', 'utf8');
  console.log('\n🚀 Vite configuration:');
  console.log(`   React plugin: ${viteConfig.includes('@vitejs/plugin-react') ? '✅' : '❌'}`);
} catch (e) {
  console.log('\n❌ Error reading vite.config.ts:', e.message);
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 Setup verification COMPLETE!');
  console.log('To complete the setup, run:');
  console.log('   npm install');
  console.log('   npm run dev');
} else {
  console.log('⚠️  Setup verification FAILED - Missing files');
}
console.log('='.repeat(50));