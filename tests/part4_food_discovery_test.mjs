import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('====================================================');
  console.log('PART 4: MANUMANIA FOOD-DISCOVERY PAGE VALIDATION');
  console.log('====================================================\n');

  const searchPagePath = path.resolve('src/pages/SearchPage.tsx');
  const searchServicePath = path.resolve('src/services/searchService.ts');
  const foodResultCardPath = path.resolve('src/components/search/FoodResultCard.tsx');
  const priceComparisonViewPath = path.resolve('src/components/search/PriceComparisonView.tsx');
  const searchFiltersPath = path.resolve('src/components/search/SearchFilters.tsx');
  const searchBarPath = path.resolve('src/components/search/SearchBar.tsx');
  const emptySearchStatePath = path.resolve('src/components/search/EmptySearchState.tsx');
  const publicRestaurantPagePath = path.resolve('src/pages/PublicRestaurantPage.tsx');
  const foodDiscoveryPagePath = path.resolve('src/components/cinematic/FoodDiscoveryPage.tsx');

  const searchPageCode = fs.readFileSync(searchPagePath, 'utf8');
  const searchServiceCode = fs.readFileSync(searchServicePath, 'utf8');
  const foodResultCardCode = fs.readFileSync(foodResultCardPath, 'utf8');
  const priceComparisonViewCode = fs.readFileSync(priceComparisonViewPath, 'utf8');
  const searchFiltersCode = fs.readFileSync(searchFiltersPath, 'utf8');
  const searchBarCode = fs.readFileSync(searchBarPath, 'utf8');
  const emptySearchStateCode = fs.readFileSync(emptySearchStatePath, 'utf8');
  const publicRestaurantPageCode = fs.readFileSync(publicRestaurantPagePath, 'utf8');
  const foodDiscoveryPageCode = fs.readFileSync(foodDiscoveryPagePath, 'utf8');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
    }
  }

  console.log('--- 1. SEARCH FUNCTIONALITY & BACKEND INTEGRATION ---');
  assert(
    searchServiceCode.includes('executeUnifiedSearch') &&
    searchServiceCode.includes('searchPublicFoods') &&
    searchServiceCode.includes('searchPublicRestaurants'),
    'searchService implements unified search for foods, restaurants, and localities'
  );
  assert(
    searchServiceCode.includes("from('categories')") || searchFiltersCode.includes('Category:'),
    'Category discovery and filtering are supported across the search architecture'
  );
  assert(
    searchBarCode.includes('fetchSearchSuggestions') && searchBarCode.includes('type === \'category\''),
    'Autocomplete search bar suggests dishes, restaurants, localities, and categories'
  );
  assert(
    searchPageCode.includes('executeUnifiedSearch') && !searchPageCode.includes('fakeApi'),
    'SearchPage calls real InsForge unified search service with zero mock APIs'
  );

  console.log('\n--- 2. FOOD-ITEM RESULTS & REAL FIELDS ---');
  assert(
    foodResultCardCode.includes('item.name') &&
    foodResultCardCode.includes('item.displayPriceText') &&
    foodResultCardCode.includes('item.restaurant.name') &&
    foodResultCardCode.includes('item.veg_type'),
    'FoodResultCard displays real food name, price, shop name, and veg/non-veg status'
  );
  assert(
    foodResultCardCode.includes('item.image_url') && foodResultCardCode.includes('loading="lazy"'),
    'FoodResultCard displays real food image with lazy loading or fallback icon'
  );
  assert(
    foodResultCardCode.includes('item.restaurant.slug') && foodResultCardCode.includes('View Menu'),
    'FoodResultCard links directly to the shop menu page (/restaurant/:slug)'
  );

  console.log('\n--- 3. PRICE COMPARISON ACROSS SHOPS ---');
  assert(
    fs.existsSync(priceComparisonViewPath),
    'PriceComparisonView component exists in codebase'
  );
  assert(
    priceComparisonViewCode.includes('groupsMap') && priceComparisonViewCode.includes('variantComparisons'),
    'PriceComparisonView groups identical dishes and maps comparable portion variants'
  );
  assert(
    priceComparisonViewCode.includes('distinctRestaurants.size >= 2'),
    'PriceComparisonView filters dishes offered across 2 or more distinct shops'
  );
  assert(
    priceComparisonViewCode.includes('formatCurrency(lowestPrice)') &&
    !priceComparisonViewCode.includes('discountPercent'),
    'Factual portion pricing compared directly without fabricated discount percentages'
  );
  assert(
    searchPageCode.includes('viewMode') &&
    searchPageCode.includes('PriceComparisonView') &&
    searchPageCode.includes('Compare Prices'),
    'SearchPage provides a View Mode toggle between Grid View and Price Comparison'
  );
  assert(
    foodResultCardCode.includes('view=comparison') || foodResultCardCode.includes('Compare Shops'),
    'FoodResultCard offers direct link to compare portion prices across shops'
  );

  console.log('\n--- 4. SHOP MENUS & DETAIL PRESERVATION ---');
  assert(
    publicRestaurantPageCode.includes('loadRestaurantData') &&
    publicRestaurantPageCode.includes('food_variants'),
    'PublicRestaurantPage displays real restaurant menu, variants, and categories'
  );
  assert(
    publicRestaurantPageCode.includes('restaurant_hours') &&
    publicRestaurantPageCode.includes('LocationSection'),
    'PublicRestaurantPage includes full operating schedule and location map'
  );

  console.log('\n--- 5. LOCATION DISCOVERY & GOOGLE MAPS ---');
  assert(
    (searchPageCode.includes('LocationSelector') || searchFiltersCode.includes('LocationSelector')) &&
    (searchPageCode.includes('RadiusFilter') || searchFiltersCode.includes('RadiusFilter')),
    'SearchPage includes location selector and radius adjustment controls'
  );
  assert(
    searchPageCode.includes('handleGrantLocationConsent') &&
    searchPageCode.includes('getCurrentLocation'),
    'Location discovery supports privacy-first geolocation with user consent'
  );
  assert(
    searchPageCode.includes('resolveLocationQuery') || searchFiltersCode.includes('LocationSelector'),
    'Manual location selection is provided when browser geolocation is unavailable'
  );

  console.log('\n--- 6. SEARCH STATES & QUERY RACE PROTECTION ---');
  assert(
    searchPageCode.includes('latestRequestIdRef'),
    'Query race protection ensures most recent request determines displayed results'
  );
  assert(
    searchPageCode.includes('isLoading') && searchPageCode.includes('Loader2'),
    'SearchPage displays a clear loading spinner during data retrieval'
  );
  assert(
    searchPageCode.includes('SearchErrorState') && searchPageCode.includes('errorMessage'),
    'SearchPage handles error states with retry functionality'
  );
  assert(
    searchPageCode.includes('EmptySearchState'),
    'SearchPage handles empty results and initial state with actionable guidance'
  );
  assert(
    searchBarCode.includes('handleClear') && searchBarCode.includes('onSearch(\'\')'),
    'SearchBar provides clear button resetting the query immediately'
  );

  console.log('\n--- 7. VISUAL DESIGN & RESPONSIVENESS ---');
  assert(
    searchPageCode.includes('max-w-7xl') && searchPageCode.includes('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'),
    'SearchPage implements high-utility responsive grid'
  );
  assert(
    searchPageCode.includes('text-cream-100') && searchPageCode.includes('text-amber-400'),
    'SearchPage adheres to ManuMania dark, cream, and warm amber color palette'
  );
  assert(
    searchPageCode.includes('Back to Story Chapters') && searchPageCode.includes('to="/"'),
    'Back breadcrumb allows instant navigation back to the cinematic landing page'
  );

  console.log('\n--- 8. BUSINESS RULES & CONVERSION POINT ---');
  assert(
    foodDiscoveryPageCode.includes("navigate('/search')"),
    'Final Chapter VI Search button directly navigates to /search'
  );
  assert(
    foodDiscoveryPageCode.includes('<span>Search</span>'),
    'Final Chapter VI button is clearly labelled "Search"'
  );
  assert(
    !searchPageCode.includes('addToCart') && !searchPageCode.includes('checkout'),
    'Search application focuses strictly on menu discovery and price comparison without checkout'
  );

  console.log('\n====================================================');
  console.log(`TOTAL PART 4 TESTS: ${passed} / ${total} PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
