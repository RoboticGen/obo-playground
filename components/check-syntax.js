// This is just a test file to check the syntax of our code

try {
  // Try to load the file
  const fs = require('fs');
  const content = fs.readFileSync('code-editor.tsx', 'utf8');
  console.log('File loaded successfully');
  console.log('Length:', content.length);
  
  // Check for unbalanced template literals
  let inTemplateLiteral = false;
  let backtickCount = 0;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '`') {
      backtickCount++;
      inTemplateLiteral = !inTemplateLiteral;
    }
  }
  
  console.log('Backtick count:', backtickCount);
  console.log('Is backtick count even?', backtickCount % 2 === 0);
  
  // Check for unbalanced braces
  let braceCount = 0;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
  }
  
  console.log('Brace balance:', braceCount);
  
} catch (err) {
  console.error('Error:', err);
}