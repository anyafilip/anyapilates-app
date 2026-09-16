const fs = require('fs');
const file = 'src/app/[locale]/(public)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const startTag = '      {/* ── Our Instructors ────────────────────────────── */}';
const endTag = '      {/* ── About Studio ─────────────────────────────── */}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully removed hardcoded instructors section.');
} else {
  console.log('Could not find instructors section to remove.');
}
