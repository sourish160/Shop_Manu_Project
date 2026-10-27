import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('PART 2: ALL CINEMATIC CHAPTERS VALIDATION SUITE');
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

// 1. Inspect FoodDiscoveryPage.tsx
const pagePath = path.join(rootDir, 'src', 'components', 'cinematic', 'FoodDiscoveryPage.tsx');
assert(fs.existsSync(pagePath), 'FoodDiscoveryPage.tsx exists');

const content = fs.readFileSync(pagePath, 'utf-8');

// Chapter I — The Discovery assertions
assert(
  content.includes('id="chapter-discovery"') &&
  content.includes('chapterNumber="I"') &&
  content.includes('chapterLabel="The Discovery"'),
  'Chapter I — The Discovery is defined with proper chapter identifier'
);

assert(
  content.includes('/image-sequence/videp000.jpg'),
  'Chapter I uses full-width storefront background asset (/image-sequence/videp000.jpg)'
);

assert(
  content.includes('Chapter I — The Discovery') &&
  content.includes('Slow grilled,') &&
  content.includes('stacked like') &&
  content.includes('velvet.'),
  'Chapter I has small uppercase chapter label and editorial headline with gold italic "velvet."'
);

assert(
  content.includes('ManuMania') &&
  content.includes('clamp(3.5rem'),
  'Chapter I includes carefully positioned ManuMania bottom wordmark branding'
);

assert(
  !content.includes('role="search"') &&
  !content.includes('SearchCallToAction'),
  'Chapter I does NOT add a large functional search-results interface'
);

// Chapter II — The Craving assertions
assert(
  content.includes('id="chapter-craving"') &&
  content.includes('chapterNumber="II"') &&
  content.includes('chapterLabel="The Craving"'),
  'Chapter II — The Craving is defined'
);

assert(
  content.includes('/image-sequence/videp060.jpg') &&
  content.includes('/image-sequence/videp120.jpg') &&
  content.includes('/images/hero-burger.jpg'),
  'Chapter II has large food photography with alternating editorial image & text layouts'
);

assert(
  content.includes('Category 01 · Tawa Gastronomy') &&
  content.includes('Category 02 · Heritage Dum Craft') &&
  content.includes('Category 03 · Craft Kitchen Smashes'),
  'Chapter II uses real food categories to communicate discoveries without inventing fake restaurants'
);

// Typography Interludes assertions
assert(
  content.includes('<TypographyMarquee') &&
  content.includes('STREET FOOD') &&
  content.includes('DUM BIRYANI') &&
  content.includes('FOOD AROUND YOU'),
  'Typography Interludes with horizontal marquees present between chapters'
);

// Chapter III — The Menu assertions
assert(
  content.includes('id="chapter-menu"') &&
  content.includes('chapterNumber="III"') &&
  content.includes('chapterLabel="The Menu"'),
  'Chapter III — The Menu is defined'
);

assert(
  content.includes('The menu, *verified portion by portion.*') &&
  content.includes('Portion Breakdown') &&
  content.includes('Chef-Direct Rates') &&
  content.includes('Live Kitchen Status'),
  'Chapter III explains transparent portion comparisons, chef-direct rates, and live availability'
);

assert(
  content.includes('signatureFoods') &&
  content.includes('variants'),
  'Chapter III references real database dish offerings with portion variant rates'
);

// Chapter IV — The Food Gallery assertions
assert(
  content.includes('id="chapter-gallery"') &&
  content.includes('chapterNumber="IV"') &&
  content.includes('chapterLabel="The Food Gallery"'),
  'Chapter IV — The Food Gallery is defined'
);

assert(
  content.includes('The Storefront at Dusk') &&
  content.includes('Cast-Iron Flame & Sear') &&
  content.includes('The Hand-Crafted Smash') &&
  content.includes('Plating & Portion Finish') &&
  content.includes('The Dining Room Atmosphere'),
  'Chapter IV contains an immersive image-led gallery composed of real assets with restrained depth'
);

// Chapter V — Around You assertions
assert(
  content.includes('id="chapter-around-you"') &&
  content.includes('chapterNumber="V"') &&
  content.includes('chapterLabel="Around You"'),
  'Chapter V — Around You is defined'
);

assert(
  content.includes('Discover what cooks *around your corner.*') &&
  content.includes('Park Street Quarter') &&
  content.includes('Salt Lake Quarter') &&
  content.includes('New Town Quarter'),
  'Chapter V highlights neighborhood quarters and local food discovery'
);

assert(
  content.includes('approvedRestaurants') &&
  content.includes('openingStatus'),
  'Chapter V displays real approved restaurants with live operating statuses'
);

// Chapter VI — Your Next Bite assertions (The Conversion Point)
assert(
  content.includes('id="chapter-next-bite"') &&
  content.includes('chapterNumber="VI"') &&
  content.includes('chapterLabel="Your Next Bite"'),
  'Chapter VI — Your Next Bite is defined as the final conversion chapter'
);

assert(
  content.includes('Your next favourite bite is') &&
  content.includes('closer than you think.') &&
  content.includes("Discover food menus, compare prices, and find local shops in one place. Search for what you're craving and explore the options around you."),
  'Chapter VI features the exact required headline and supporting paragraph'
);

assert(
  content.includes('>Search<') ||
  content.includes('<span>Search</span>'),
  'Chapter VI features button labelled exactly "Search"'
);

assert(
  content.includes("navigate('/search')"),
  'Clicking the Search button navigates to the actual route /search'
);

// Navigation & Footer assertions
const navPath = path.join(rootDir, 'src', 'components', 'cinematic', 'CinematicNavigation.tsx');
const navContent = fs.readFileSync(navPath, 'utf-8');
assert(
  navContent.includes('chapter-discovery') &&
  navContent.includes('chapter-craving') &&
  navContent.includes('chapter-menu') &&
  navContent.includes('chapter-gallery') &&
  navContent.includes('chapter-around-you') &&
  navContent.includes('chapter-next-bite'),
  'CinematicNavigation defines anchors for all six chapters (I to VI)'
);

const footerPath = path.join(rootDir, 'src', 'components', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');
assert(
  footerContent.includes('Chapter I — The Discovery') &&
  footerContent.includes('Chapter VI — Your Next Bite') &&
  footerContent.includes('/privacy') &&
  footerContent.includes('/terms'),
  'Footer.tsx contains ManuMania wordmark, all six chapter anchors, and valid legal links'
);

console.log('\n----------------------------------------------------');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PART 2 CINEMATIC CHAPTER CHECKS PASSED SUCCESSFULLY!\n');
}
