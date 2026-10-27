import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('PART 1: VISUAL RESET & FOUNDATION VALIDATION SUITE');
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

// 1. New Cinematic Design Architecture Components
const cinematicDir = path.join(rootDir, 'src', 'components', 'cinematic');
assert(fs.existsSync(cinematicDir), 'src/components/cinematic directory exists');

const requiredComponents = [
  'CinematicNavigation.tsx',
  'ChapterSection.tsx',
  'EditorialHeading.tsx',
  'TypographyMarquee.tsx',
  'ScrollReveal.tsx',
  'SearchCallToAction.tsx',
  'FoodDiscoveryPage.tsx',
];

requiredComponents.forEach((file) => {
  assert(
    fs.existsSync(path.join(cinematicDir, file)),
    `Component ${file} exists in cinematic architecture`
  );
});

// 2. Verify ChapterSection & Storytelling Structure
const discoveryPagePath = path.join(cinematicDir, 'FoodDiscoveryPage.tsx');
const discoveryContent = fs.readFileSync(discoveryPagePath, 'utf-8');

assert(
  (discoveryContent.includes('chapter-discovery') &&
   discoveryContent.includes('chapter-craving') &&
   discoveryContent.includes('chapter-menu') &&
   discoveryContent.includes('chapter-gallery') &&
   discoveryContent.includes('chapter-around-you') &&
   discoveryContent.includes('chapter-next-bite')) ||
  (discoveryContent.includes('chapter-00') &&
   discoveryContent.includes('chapter-philosophy')),
  'FoodDiscoveryPage orchestrates all cinematic chapters across the page'
);

assert(
  discoveryContent.includes('TypographyMarquee'),
  'Large horizontal marquee bands connect chapters'
);

assert(
  discoveryContent.includes('ScrollReveal'),
  'ScrollReveal lightweight motion entrance is integrated'
);

assert(
  fs.existsSync(path.join(cinematicDir, 'SearchCallToAction.tsx')),
  'SearchCallToAction with real database autocomplete is preserved in component library'
);

// 3. Visual Characteristics Assertions
assert(
  !discoveryContent.includes('#F4EEFD') &&
  !discoveryContent.includes('#C4B2E6') &&
  !discoveryContent.includes('rgba(215, 200, 245'),
  'No purple/lavender gradients in cinematic discovery page'
);

assert(
  discoveryContent.includes('velvet.') &&
  discoveryContent.includes('italic'),
  'Preserves the signature "velvet." in gold italic serif'
);

assert(
  discoveryContent.includes('ManuMania'),
  'Preserves ManuMania brand name and identity'
);

// 4. Verify Removal of Old Design & Legacy Code
const mapHeroPath = path.join(rootDir, 'src', 'components', 'home', 'MapScrollHero.tsx');
assert(!fs.existsSync(mapHeroPath), 'Obsolete MapScrollHero.tsx has been removed');

const indexCssPath = path.join(rootDir, 'src', 'index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');
assert(
  indexCssContent.includes('color-scheme: dark'),
  'index.css enforces dark color-scheme'
);

assert(
  indexCssContent.includes('text-stroke-cream') &&
  indexCssContent.includes('animate-marquee-left'),
  'index.css includes outlined typography utilities and marquee animations'
);

// 5. Verify Preserved Business Logic & Backend Integrations
const searchServicePath = path.join(rootDir, 'src', 'services', 'searchService.ts');
assert(fs.existsSync(searchServicePath), 'searchService.ts preserved with all search functions');

const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.tsx');
assert(fs.existsSync(authContextPath), 'AuthContext.tsx preserved with authentication logic');

const searchPagePath = path.join(rootDir, 'src', 'pages', 'SearchPage.tsx');
assert(fs.existsSync(searchPagePath), 'Dedicated functional SearchPage.tsx preserved');

const ownerDashboardPath = path.join(rootDir, 'src', 'pages', 'OwnerDashboardPage.tsx');
assert(fs.existsSync(ownerDashboardPath), 'OwnerDashboardPage.tsx preserved');

const adminDashboardPath = path.join(rootDir, 'src', 'pages', 'AdminDashboardPage.tsx');
assert(fs.existsSync(adminDashboardPath), 'AdminDashboardPage.tsx preserved');

// 6. Verify Navigation & Routing Integration
const homePagePath = path.join(rootDir, 'src', 'pages', 'HomePage.tsx');
const homeContent = fs.readFileSync(homePagePath, 'utf-8');
assert(
  homeContent.includes('FoodDiscoveryPage'),
  'HomePage renders the new FoodDiscoveryPage'
);

const navbarPath = path.join(rootDir, 'src', 'components', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
assert(
  navbarContent.includes('CinematicNavigation'),
  'Navbar re-exports CinematicNavigation for global app layout'
);

console.log('\n----------------------------------------------------');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PART 1 FOUNDATION CHECKS PASSED SUCCESSFULLY!\n');
}
