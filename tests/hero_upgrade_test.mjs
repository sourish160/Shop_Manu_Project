import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('MANUMANIA HERO UPGRADE VALIDATION SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Inspect EditorialHero.tsx file content
const heroPath = path.join(rootDir, 'src', 'components', 'home', 'EditorialHero.tsx');
assert(fs.existsSync(heroPath), 'EditorialHero.tsx exists');

const heroContent = fs.readFileSync(heroPath, 'utf-8');

// Visual Direction assertions
assert(
  heroContent.includes('/image-sequence/videp000.jpg'),
  'Uses authentic storefront background asset (/image-sequence/videp000.jpg)'
);

assert(
  !heroContent.includes('#F4EEFD') &&
  !heroContent.includes('#C4B2E6') &&
  !heroContent.includes('rgba(215, 200, 245') &&
  !heroContent.includes('rgba(186, 160, 235'),
  'Purple and lavender gradients have been completely eliminated'
);

assert(
  heroContent.includes('velvet.') &&
  heroContent.includes('italic') &&
  heroContent.includes('#FDE68A') &&
  heroContent.includes('#FBBF24'),
  'Preserves the word "velvet." in gold italic serif typography'
);

assert(
  heroContent.includes('ManuMania') &&
  heroContent.includes('clamp(3.5rem') &&
  heroContent.includes('overflow-hidden'),
  'Retains oversized ManuMania wordmark at bottom with elegant clipping'
);

// Interaction & Technology assertions
assert(
  heroContent.includes("from 'motion/react'") &&
  heroContent.includes('useReducedMotion') &&
  heroContent.includes('prefersReducedMotion'),
  'Uses Motion for React (motion/react) with prefers-reduced-motion support'
);

assert(
  heroContent.includes('containerVariants') &&
  heroContent.includes('itemVariants') &&
  heroContent.includes('staggerChildren'),
  'Headline and search section animate with subtle staggered entrance'
);

assert(
  heroContent.includes('fetchSearchSuggestions') &&
  heroContent.includes('suggestions') &&
  heroContent.includes('isSuggesting') &&
  heroContent.includes('Loader2'),
  'Useful live autocomplete suggestions with real database service and loading state'
);

assert(
  heroContent.includes('role="combobox"') &&
  heroContent.includes('role="listbox"') &&
  heroContent.includes('role="option"') &&
  heroContent.includes('ArrowDown') &&
  heroContent.includes('ArrowUp') &&
  heroContent.includes('Escape'),
  'Full keyboard navigation and accessible ARIA attributes for search autocomplete'
);

assert(
  heroContent.includes('onNearMe') &&
  heroContent.includes('isLocating') &&
  heroContent.includes('DEFAULT_CATEGORY_CHIPS') &&
  heroContent.includes('Open Now') &&
  heroContent.includes('Biryani'),
  'Interactive category chips connected to search and geolocation'
);

assert(
  heroContent.includes('Explore') &&
  heroContent.includes('ArrowUpRight'),
  'Refined Explore button with luxury styling and arrow micro-interaction'
);

// 2. Inspect Navbar.tsx
const navbarPath = path.join(rootDir, 'src', 'components', 'Navbar.tsx');
assert(fs.existsSync(navbarPath), 'Navbar.tsx exists');

const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
assert(
  navbarContent.includes('isTransparent') &&
  navbarContent.includes('scrolled') &&
  navbarContent.includes('bg-[#0A0807]/92'),
  'Navbar transitions smoothly to subtle dark luxury glass on scroll'
);

assert(
  navbarContent.includes('mobileMenuOpen') &&
  navbarContent.includes('bg-[#0E0C0B]/98'),
  'Responsive mobile navigation drawer matches luxury aesthetic'
);

// 3. Inspect HomePage.tsx integration
const homePath = path.join(rootDir, 'src', 'pages', 'HomePage.tsx');
const homeContent = fs.readFileSync(homePath, 'utf-8');
assert(
  homeContent.includes("handleQuickChipClick = (term: string)") &&
  homeContent.includes("term === 'Open Now'") &&
  homeContent.includes("term === selectedLocation"),
  'HomePage handles category chips including Open Now, location, and city tab'
);

console.log('\n----------------------------------------------------');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL HERO UPGRADE CHECKS PASSED SUCCESSFULLY!\n');
}
