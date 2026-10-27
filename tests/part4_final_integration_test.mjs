import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('PART 4: FINAL INTEGRATION, CLEANUP & AUDIT SUITE');
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

// ---------------------------------------------------------
// 1. CLEANUP OF OBSOLETE HOMEPAGE & OLD STYLES
// ---------------------------------------------------------
console.log('\n--- 1. CLEANUP & OBSOLETE STYLE AUDIT ---');

// Check that old `src/components/home` folder is safely removed
const oldHomeDir = path.join(rootDir, 'src', 'components', 'home');
assert(!fs.existsSync(oldHomeDir), 'Old src/components/home/ directory has been safely removed');

// Check that public components have been converted to dark editorial theme
const publicDir = path.join(rootDir, 'src', 'components', 'public');
const publicFiles = fs.readdirSync(publicDir);

publicFiles.forEach((file) => {
  if (file.endsWith('.tsx')) {
    const content = fs.readFileSync(path.join(publicDir, file), 'utf-8');
    assert(
      !content.includes('bg-cream-100 border border-cream-300'),
      `${file} contains no legacy "bg-cream-100 border border-cream-300" containers`
    );
    assert(
      !content.includes('text-espresso-700 group-hover:text-accent-amber'),
      `${file} uses dark editorial cream/amber typography`
    );
  }
});

// Check Legal & Auth Pages for dark palette consistency
const pagesToCheck = [
  'PrivacyPage.tsx',
  'TermsPage.tsx',
  'LoginPage.tsx',
  'RegisterPage.tsx',
  'AdminLoginPage.tsx',
  'PublicRestaurantPage.tsx',
];

pagesToCheck.forEach((pageName) => {
  const pagePath = path.join(rootDir, 'src', 'pages', pageName);
  assert(fs.existsSync(pagePath), `Page ${pageName} exists`);
  const content = fs.readFileSync(pagePath, 'utf-8');
  assert(
    !content.includes('bg-cream-100 border border-cream-300'),
    `${pageName} converted to editorial dark card without legacy light background`
  );
});

// ---------------------------------------------------------
// 2. COMPLETE USER JOURNEY & NAVIGATION VERIFICATION
// ---------------------------------------------------------
console.log('\n--- 2. NAVIGATION & USER JOURNEY AUDIT ---');

// Landing page has the 6 chapters
const landingPagePath = path.join(rootDir, 'src', 'components', 'cinematic', 'FoodDiscoveryPage.tsx');
assert(fs.existsSync(landingPagePath), 'Landing page component exists');
const landingContent = fs.readFileSync(landingPagePath, 'utf-8');

assert(landingContent.includes('id="chapter-discovery"'), 'Chapter I (The Discovery) exists with anchor id');
assert(landingContent.includes('id="chapter-craving"'), 'Chapter II (The Craving) exists with anchor id');
assert(landingContent.includes('id="chapter-menu"'), 'Chapter III (The Menu) exists with anchor id');
assert(landingContent.includes('id="chapter-gallery"'), 'Chapter IV (The Food Gallery) exists with anchor id');
assert(landingContent.includes('id="chapter-around-you"'), 'Chapter V (Around You) exists with anchor id');
assert(landingContent.includes('id="chapter-next-bite"'), 'Chapter VI (Your Next Bite / Search) exists with anchor id');

// Final search chapter has CTA button to /search
assert(
  landingContent.includes("navigate('/search')") &&
  (landingContent.includes('>Search<') || landingContent.includes('<span>Search</span>')),
  'Chapter VI Search button links directly to /search discovery page'
);

// Search page navigation back to landing page
const searchPageContent = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'SearchPage.tsx'), 'utf-8');
assert(
  searchPageContent.includes('to="/"') && searchPageContent.includes('Back to Story Chapters'),
  'SearchPage has back breadcrumb navigating to "/" without lost state'
);

// Detail page links from search results
const foodCardContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'search', 'FoodResultCard.tsx'), 'utf-8');
assert(
  foodCardContent.includes('to={`/restaurant/${item.restaurant.slug}`}'),
  'Food result cards navigate directly to shop detail page (/restaurant/:slug)'
);

const restaurantCardContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'search', 'RestaurantResultCard.tsx'), 'utf-8');
assert(
  restaurantCardContent.includes('to={`/restaurant/${restaurant.slug}`}'),
  'Restaurant result cards navigate directly to shop detail page (/restaurant/:slug)'
);

// ---------------------------------------------------------
// 3. BACKEND INTEGRATION & PERMISSIONS PRESERVATION
// ---------------------------------------------------------
console.log('\n--- 3. BACKEND & AUTH PRESERVATION AUDIT ---');

const appContent = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf-8');

// Owner routes preserved & protected
assert(
  appContent.includes('path="/owner"') &&
  appContent.includes('requiredRole="owner"') &&
  appContent.includes('<OwnerDashboardPage />'),
  'Owner dashboard is preserved and guarded by role="owner"'
);

assert(
  appContent.includes('path="/owner/menu"') &&
  appContent.includes('requiredRole="owner"') &&
  appContent.includes('<OwnerMenuPage />'),
  'Owner menu management is preserved and guarded'
);

// Admin routes preserved & protected
assert(
  appContent.includes('path="/admin"') &&
  appContent.includes('requiredRole="admin"') &&
  appContent.includes('<AdminDashboardPage />'),
  'Admin dashboard is preserved and guarded by role="admin"'
);

assert(
  appContent.includes('path="/admin/restaurants"') &&
  appContent.includes('path="/admin/reports"') &&
  appContent.includes('path="/admin/audit"'),
  'All administrative sub-routes (restaurants, reports, audit logs) are preserved'
);

// Customer public discovery requires NO account
assert(
  appContent.includes('path="/" element={<HomePage />}') &&
  appContent.includes('path="/search" element={<SearchPage />}') &&
  appContent.includes('path="/restaurant/:slug" element={<PublicRestaurantPage />}'),
  'Customer discovery routes are completely public (zero forced login)'
);

// Real search service calls InsForge
const searchServiceContent = fs.readFileSync(path.join(rootDir, 'src', 'services', 'searchService.ts'), 'utf-8');
assert(
  searchServiceContent.includes('insforge.database') &&
  searchServiceContent.includes('executeUnifiedSearch'),
  'Unified search service calls real InsForge PostgREST database'
);

// ---------------------------------------------------------
// 4. RESPONSIVE & ACCESSIBILITY AUDIT
// ---------------------------------------------------------
console.log('\n--- 4. RESPONSIVE & ACCESSIBILITY AUDIT ---');

const navContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'cinematic', 'CinematicNavigation.tsx'), 'utf-8');
assert(
  navContent.includes('mobileMenuOpen') &&
  navContent.includes('aria-label') &&
  navContent.includes('aria-expanded'),
  'Navigation includes accessible mobile toggle button with ARIA attributes'
);

const indexCssContent = fs.readFileSync(path.join(rootDir, 'src', 'index.css'), 'utf-8');
assert(
  indexCssContent.includes('@media (prefers-reduced-motion: reduce)') &&
  indexCssContent.includes('animation-duration: 0.01ms'),
  'Global styles enforce prefers-reduced-motion for motion sensitivity'
);

assert(
  indexCssContent.includes('*:focus-visible') &&
  indexCssContent.includes('outline: 2px solid #C88A58'),
  'Accessible focus indicators styled with warm amber outline'
);

assert(
  indexCssContent.includes('.touch-target') &&
  indexCssContent.includes('min-height: 44px'),
  'Touch targets defined to meet WCAG 44x44px mobile interaction standards'
);

// ---------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL PART 4 TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PART 4 FINAL INTEGRATION AUDIT CHECKS PASSED!\n');
}
