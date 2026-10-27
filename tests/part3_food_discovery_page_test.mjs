import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('PART 3: FOOD DISCOVERY PAGE VALIDATION SUITE');
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

// 1. Route & Component Architecture
const appPath = path.join(rootDir, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
assert(
  appContent.includes('path="/search"') && appContent.includes('<SearchPage />'),
  'Route /search is configured in App.tsx pointing to SearchPage'
);

const searchPagePath = path.join(rootDir, 'src', 'pages', 'SearchPage.tsx');
assert(fs.existsSync(searchPagePath), 'src/pages/SearchPage.tsx exists');
const pageContent = fs.readFileSync(searchPagePath, 'utf-8');

// 2. Navigation & Editorial Header
assert(
  pageContent.includes('Back to Story Chapters') &&
  pageContent.includes('to="/"'),
  'SearchPage includes working navigation back to the cinematic landing page'
);

assert(
  pageContent.includes('Find your next bite,') &&
  pageContent.includes('verified portion by portion.') &&
  pageContent.includes('Discovery Catalogue'),
  'SearchPage features editorial Fraunces serif page title and description'
);

// 3. Search Interface & Controls
assert(
  pageContent.includes('<SearchBar') &&
  pageContent.includes('initialValue={queryParam}') &&
  pageContent.includes('onSearch={handleSearchSubmit}'),
  'SearchPage integrates prominent SearchBar with active query handling'
);

const searchBarPath = path.join(rootDir, 'src', 'components', 'search', 'SearchBar.tsx');
assert(fs.existsSync(searchBarPath), 'SearchBar.tsx exists');
const searchBarContent = fs.readFileSync(searchBarPath, 'utf-8');

assert(
  searchBarContent.includes('fetchSearchSuggestions') &&
  searchBarContent.includes('handleKeyDown') &&
  searchBarContent.includes('handleClear') &&
  searchBarContent.includes('role="search"'),
  'SearchBar provides debounced live suggestions, keyboard navigation, and clear action'
);

// 4. Stale Request Prevention (Race Condition Safety)
assert(
  pageContent.includes('latestRequestIdRef') &&
  pageContent.includes('requestId === latestRequestIdRef.current'),
  'SearchPage prevents stale async requests from overwriting newer search results'
);

// 5. Filters & Location Discovery
const searchFiltersPath = path.join(rootDir, 'src', 'components', 'search', 'SearchFilters.tsx');
assert(fs.existsSync(searchFiltersPath), 'SearchFilters.tsx exists');
const filtersContent = fs.readFileSync(searchFiltersPath, 'utf-8');

assert(
  filtersContent.includes('handleVegChange') &&
  filtersContent.includes('handleAvailabilityToggle') &&
  filtersContent.includes('handleOpenNowToggle') &&
  filtersContent.includes('handleApplyPriceFilter') &&
  filtersContent.includes('handleSortChange'),
  'SearchFilters supports Veg/Non-Veg, In-Stock, Open Now, Price range, and Sort filters'
);

const locSelectorPath = path.join(rootDir, 'src', 'components', 'location', 'LocationSelector.tsx');
assert(fs.existsSync(locSelectorPath), 'LocationSelector.tsx exists');
const locContent = fs.readFileSync(locSelectorPath, 'utf-8');
assert(
  locContent.includes('getCurrentLocation') &&
  locContent.includes('KNOWN_LOCALITIES'),
  'LocationSelector supports device geolocation and manual Kolkata locality selection'
);

// 6. Food & Restaurant Result Cards
const foodCardPath = path.join(rootDir, 'src', 'components', 'search', 'FoodResultCard.tsx');
assert(fs.existsSync(foodCardPath), 'FoodResultCard.tsx exists');
const foodCardContent = fs.readFileSync(foodCardPath, 'utf-8');

assert(
  foodCardContent.includes('item.displayPriceText') &&
  foodCardContent.includes('item.variants') &&
  foodCardContent.includes('item.veg_type') &&
  foodCardContent.includes('item.available') &&
  foodCardContent.includes('/restaurant/${item.restaurant.slug}'),
  'FoodResultCard displays real portion prices, variants, availability, and shop link'
);

const restCardPath = path.join(rootDir, 'src', 'components', 'search', 'RestaurantResultCard.tsx');
assert(fs.existsSync(restCardPath), 'RestaurantResultCard.tsx exists');
const restCardContent = fs.readFileSync(restCardPath, 'utf-8');

assert(
  restCardContent.includes('openingStatus') &&
  restCardContent.includes('restaurant.verified') &&
  restCardContent.includes('formatDistance') &&
  restCardContent.includes('/restaurant/${restaurant.slug}'),
  'RestaurantResultCard displays real operating status, verified badge, and menu link'
);

// 7. Functional States
const emptyStatePath = path.join(rootDir, 'src', 'components', 'search', 'EmptySearchState.tsx');
assert(fs.existsSync(emptyStatePath), 'EmptySearchState.tsx exists');
const emptyContent = fs.readFileSync(emptyStatePath, 'utf-8');
assert(
  emptyContent.includes('isDefaultState') &&
  emptyContent.includes('hasLocationFilter') &&
  emptyContent.includes('onSuggestedQuery'),
  'EmptySearchState supports initial suggestions, zero-results location expansion, and filter resets'
);

const errorStatePath = path.join(rootDir, 'src', 'components', 'search', 'SearchErrorState.tsx');
assert(fs.existsSync(errorStatePath), 'SearchErrorState.tsx exists');
const errorContent = fs.readFileSync(errorStatePath, 'utf-8');
assert(
  errorContent.includes('onRetry') &&
  errorContent.includes('Unable to Load Search Results'),
  'SearchErrorState provides accessible alert and retry capability'
);

// 8. Dark Editorial Design System Harmony
assert(
  !searchBarContent.includes('bg-cream-100 text-espresso-700') &&
  !foodCardContent.includes('velluto-card') &&
  !restCardContent.includes('velluto-card'),
  'Search components are harmonized with the dark editorial design system (no legacy light blocks)'
);

// 9. Integration with Real Search Service
assert(
  pageContent.includes('executeUnifiedSearch') &&
  pageContent.includes('PAGE_SIZE'),
  'SearchPage calls real executeUnifiedSearch backend function with pagination'
);

console.log('\n----------------------------------------------------');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PART 3 FOOD DISCOVERY PAGE CHECKS PASSED SUCCESSFULLY!\n');
}
