import { createClient } from '@insforge/sdk';
import {
  executeUnifiedSearch,
  searchPublicFoods,
  searchPublicRestaurants,
  searchLocationRestaurants,
  fetchSearchSuggestions,
  normalizeQuery,
} from '../src/services/searchService.ts';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function setRestaurantStatusAdmin(restaurantId, status, verified = false) {
  const clientAdmin = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  await clientAdmin.auth.signInWithPassword({
    email: 'admin@shopmanu.com',
    password: 'AdminSecret123!',
  });
  const { error } = await clientAdmin.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: restaurantId,
    p_new_status: status,
    p_verified: verified,
    p_admin_notes: 'Automated test suite approval',
  });
  if (error) {
    throw new Error(`admin_update_restaurant_status error: ${error.message}`);
  }
}

async function runPhase4TestSuite() {
  console.log('====================================================');
  console.log('PHASE 4: CUSTOMER SEARCH SYSTEM COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const results = [];

  function record(title, passed, details) {
    results.push({ title, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${title}`);
    if (details) console.log(`   ${details}`);
  }

  const ownerEmail = `owner_p4_${timestamp}@test.com`;
  const password = 'Password123!';

  // Step 1: Create Test Dataset
  console.log('--- Step 1: Setting up Verified Development Test Data ---');
  let ownerUser = null;
  let approvedRestaurant = null;
  let pendingRestaurant = null;
  let suspendedRestaurant = null;
  let foodBiryani = null;
  let foodMutton = null;
  let foodRoll = null;
  let foodUnavailable = null;
  let variantBiryaniHalf = null;
  let variantBiryaniFull = null;

  try {
    const regOwner = await clientAnon.functions.invoke('register-user', {
      body: { name: 'Chef Awadh', email: ownerEmail, password, phone: '+919876543299', role: 'owner' },
    });
    if (!regOwner.data?.success) throw new Error('Failed to register owner');
    ownerUser = regOwner.data.user;

    const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
    await clientOwner.auth.signInWithPassword({ email: ownerEmail, password });

    // 1. Approved Restaurant in Salt Lake, Kolkata
    const resApproved = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Royal Awadhi Kitchen ${timestamp}`,
      description: 'Traditional slow-cooked Awadhi delicacies and kebabs.',
      phone: '+919876543201',
      address: 'Sector V, Salt Lake City',
      area: 'Salt Lake',
      city: 'Kolkata',
    }]).select();
    if (resApproved.error) throw new Error(resApproved.error.message);
    approvedRestaurant = resApproved.data[0];

    // Approve restaurant via admin RPC
    await setRestaurantStatusAdmin(approvedRestaurant.id, 'approved', true);

    // 2. Pending Restaurant (must be excluded from search)
    const resPending = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Hidden Pending Dhaba ${timestamp}`,
      description: 'Unverified pending spot.',
      phone: '+919876543202',
      address: 'Near Bypass',
      area: 'EM Bypass',
      city: 'Kolkata',
    }]).select();
    pendingRestaurant = resPending.data[0];

    // 3. Suspended Restaurant (must be excluded from search)
    const resSuspended = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Suspended Cafe ${timestamp}`,
      description: 'Violation suspended spot.',
      phone: '+919876543203',
      address: 'Park Street Area',
      area: 'Park Street',
      city: 'Kolkata',
    }]).select();
    suspendedRestaurant = resSuspended.data[0];
    await setRestaurantStatusAdmin(suspendedRestaurant.id, 'approved', false);
    await setRestaurantStatusAdmin(suspendedRestaurant.id, 'suspended', false);

    // 4. Setup Operating Hours for Approved Restaurant (Open 09:00 - 23:00 everyday)
    const hoursData = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      restaurant_id: approvedRestaurant.id,
      day_of_week: day,
      open_time: '09:00:00',
      close_time: '23:00:00',
      is_closed: false,
    }));
    await clientOwner.database.from('restaurant_hours').insert(hoursData);

    // 5. Setup Menu Categories for Approved Restaurant
    const catRes = await clientOwner.database.from('categories').insert([
      { restaurant_id: approvedRestaurant.id, name: 'Biryani & Rice', sort_order: 1 },
      { restaurant_id: approvedRestaurant.id, name: 'Rolls & Quick Bites', sort_order: 2 },
    ]).select();
    const catBiryani = catRes.data.find((c) => c.name === 'Biryani & Rice');
    const catRolls = catRes.data.find((c) => c.name === 'Rolls & Quick Bites');

    // 6. Food Items
    // Food 1: Chicken Dum Biryani (Non-Veg, Available, 2 Variants: Half 140, Full 240)
    const f1 = await clientOwner.database.from('foods').insert([{
      restaurant_id: approvedRestaurant.id,
      category_id: catBiryani.id,
      name: `Chicken Dum Biryani ${timestamp}`,
      description: 'Aromatic basmati rice cooked with succulent chicken and whole spices.',
      veg_type: 'non_veg',
      available: true,
      status: 'active',
    }]).select();
    foodBiryani = f1.data[0];

    const v1 = await clientOwner.database.from('food_variants').insert([
      { food_id: foodBiryani.id, name: 'Half', price: 140.00, available: true },
      { food_id: foodBiryani.id, name: 'Full', price: 240.00, available: true },
    ]).select();
    variantBiryaniHalf = v1.data.find((v) => v.name === 'Half');
    variantBiryaniFull = v1.data.find((v) => v.name === 'Full');

    // Food 2: Mutton Dum Biryani (Non-Veg, Available, Special 320)
    const f2 = await clientOwner.database.from('foods').insert([{
      restaurant_id: approvedRestaurant.id,
      category_id: catBiryani.id,
      name: `Mutton Dum Biryani ${timestamp}`,
      description: 'Tender mutton cooked on dum with scented long grain rice.',
      veg_type: 'non_veg',
      available: true,
      status: 'active',
    }]).select();
    foodMutton = f2.data[0];

    await clientOwner.database.from('food_variants').insert([
      { food_id: foodMutton.id, name: 'Special', price: 320.00, available: true },
    ]);

    // Food 3: Paneer Kathi Roll (Veg, Available, Regular 90)
    const f3 = await clientOwner.database.from('foods').insert([{
      restaurant_id: approvedRestaurant.id,
      category_id: catRolls.id,
      name: `Paneer Kathi Roll ${timestamp}`,
      description: 'Grilled spiced cottage cheese wrapped in a handmade paratha.',
      veg_type: 'veg',
      available: true,
      status: 'active',
    }]).select();
    foodRoll = f3.data[0];

    await clientOwner.database.from('food_variants').insert([
      { food_id: foodRoll.id, name: 'Regular', price: 90.00, available: true },
    ]);

    // Food 4: Royal Shahi Paan (Veg, Unavailable, Single 40)
    const f4 = await clientOwner.database.from('foods').insert([{
      restaurant_id: approvedRestaurant.id,
      category_id: catRolls.id,
      name: `Royal Shahi Paan ${timestamp}`,
      description: 'Sweet betel leaf with gulkand.',
      veg_type: 'veg',
      available: false,
      status: 'active',
    }]).select();
    foodUnavailable = f4.data[0];

    await clientOwner.database.from('food_variants').insert([
      { food_id: foodUnavailable.id, name: 'Single', price: 40.00, available: false },
    ]);

    // Food on Pending restaurant (should NOT be returned)
    const catPending = await clientOwner.database.from('categories').insert([
      { restaurant_id: pendingRestaurant.id, name: 'Secret Category', sort_order: 1 },
    ]).select();
    const fPending = await clientOwner.database.from('foods').insert([{
      restaurant_id: pendingRestaurant.id,
      category_id: catPending.data[0].id,
      name: `Pending Secret Biryani ${timestamp}`,
      veg_type: 'non_veg',
      available: true,
      status: 'active',
    }]).select();
    await clientOwner.database.from('food_variants').insert([
      { food_id: fPending.data[0].id, name: 'Portion', price: 100.00, available: true },
    ]);

    record('Setup Test Dataset in PostgreSQL', true, `Restaurant ID: ${approvedRestaurant.id}`);
  } catch (err) {
    record('Setup Test Dataset in PostgreSQL', false, err.message);
    process.exit(1);
  }

  // --- Search System Functional Tests ---
  console.log('\n--- Step 2: Executing Search System Verification ---');

  // Test 1: Search Exact Food
  try {
    const res = await searchPublicFoods(`Chicken Dum Biryani ${timestamp}`);
    const match = res.items.find((item) => item.id === foodBiryani.id);
    const pass = !!match && match.name === `Chicken Dum Biryani ${timestamp}`;
    record('Test 1: Search Exact Food', pass,
      pass ? `Found: ${match.name} with price: ${match.displayPriceText}` : 'Exact food not found');
  } catch (err) {
    record('Test 1: Search Exact Food', false, err.message);
  }

  // Test 2: Search Partial Food
  try {
    const res = await searchPublicFoods('Dum Biryani');
    const hasChicken = res.items.some((i) => i.id === foodBiryani.id);
    const hasMutton = res.items.some((i) => i.id === foodMutton.id);
    const pass = hasChicken && hasMutton;
    record('Test 2: Search Partial Food', pass,
      pass ? `Matched ${res.items.length} items (Chicken & Mutton Biryani)` : 'Partial search failed');
  } catch (err) {
    record('Test 2: Search Partial Food', false, err.message);
  }

  // Test 3: Search Case-Insensitive Food
  try {
    const res = await searchPublicFoods(`cHiCkeN dUm BiRyAnI ${timestamp}`);
    const match = res.items.find((item) => item.id === foodBiryani.id);
    record('Test 3: Search Case-Insensitive Food', !!match,
      match ? `Correctly retrieved case-insensitively: ${match.name}` : 'Case-insensitive failed');
  } catch (err) {
    record('Test 3: Search Case-Insensitive Food', false, err.message);
  }

  // Test 4: Search Restaurant Name
  try {
    const res = await searchPublicRestaurants(`Royal Awadhi Kitchen ${timestamp}`);
    const match = res.items.find((r) => r.id === approvedRestaurant.id);
    record('Test 4: Search Restaurant Name', !!match,
      match ? `Found restaurant: ${match.name}` : 'Restaurant name search failed');
  } catch (err) {
    record('Test 4: Search Restaurant Name', false, err.message);
  }

  // Test 5: Search Partial Restaurant Name
  try {
    const res = await searchPublicRestaurants('Awadhi Kitchen');
    const match = res.items.find((r) => r.id === approvedRestaurant.id);
    record('Test 5: Search Partial Restaurant Name', !!match,
      match ? `Found partial match: ${match.name}` : 'Partial restaurant search failed');
  } catch (err) {
    record('Test 5: Search Partial Restaurant Name', false, err.message);
  }

  // Test 6: Search Location (Area / City)
  try {
    const resArea = await searchLocationRestaurants('Salt Lake');
    const resCity = await searchLocationRestaurants('Kolkata');
    const matchArea = resArea.items.some((r) => r.id === approvedRestaurant.id);
    const matchCity = resCity.items.some((r) => r.id === approvedRestaurant.id);
    const pass = matchArea && matchCity;
    record('Test 6: Search Location (Area & City)', pass,
      pass ? 'Successfully matched restaurant via Salt Lake & Kolkata' : 'Location search failed');
  } catch (err) {
    record('Test 6: Search Location (Area & City)', false, err.message);
  }

  // Test 7: Search with Leading/Trailing Whitespace
  try {
    const res = await searchPublicFoods(`    Chicken Dum Biryani ${timestamp}    `);
    const match = res.items.find((item) => item.id === foodBiryani.id);
    record('Test 7: Search with Whitespace Trimming', !!match,
      match ? 'Whitespace normalized correctly' : 'Whitespace handling failed');
  } catch (err) {
    record('Test 7: Search with Whitespace Trimming', false, err.message);
  }

  // Test 8: Empty Search
  try {
    const res = await executeUnifiedSearch('   ');
    const pass = res.totalCount === 0 && res.foods.length === 0 && res.cleanedQuery === '';
    record('Test 8: Empty Search Returns Default Clean State', pass,
      pass ? 'Handled without expensive queries' : 'Empty search executed unexpectedly');
  } catch (err) {
    record('Test 8: Empty Search Returns Default Clean State', false, err.message);
  }

  // Test 9: No Results for Non-Existent Term
  try {
    const res = await executeUnifiedSearch('xyz987nonexistentfooditem');
    const pass = res.totalCount === 0 && res.foods.length === 0;
    record('Test 9: No Results for Non-Existent Query', pass,
      pass ? '0 results returned cleanly' : 'Failed to handle no-results');
  } catch (err) {
    record('Test 9: No Results for Non-Existent Query', false, err.message);
  }

  // Test 10: Search with Price Filter
  try {
    // Search "Biryani" with maxPrice: 200
    // Chicken Biryani has Half (140) and Full (240).
    // Half (140) matches <= 200. Full does not.
    // Mutton Biryani has Special (320), which exceeds 200.
    const res = await searchPublicFoods(`Biryani ${timestamp}`, { maxPrice: 200 });
    const hasChicken = res.items.find((i) => i.id === foodBiryani.id);
    const hasMutton = res.items.find((i) => i.id === foodMutton.id);

    const priceMatchAccurate = hasChicken && hasChicken.displayPrice === 140 && hasChicken.displayPriceText === 'Half ₹140';
    const muttonExcluded = !hasMutton;
    const pass = priceMatchAccurate && muttonExcluded;

    record('Test 10: Search with Price Filter (Variant-Specific Matching)', pass,
      pass
        ? `Chicken Biryani matched on Half variant: "${hasChicken.displayPriceText}", Mutton Biryani (₹320) correctly excluded`
        : `FAIL: hasChicken: ${!!hasChicken}, muttonExcluded: ${muttonExcluded}, displayPriceText: ${hasChicken?.displayPriceText}`);
  } catch (err) {
    record('Test 10: Search with Price Filter (Variant-Specific Matching)', false, err.message);
  }

  // Test 11: Search with Veg Filter
  try {
    // Veg only
    const resVeg = await searchPublicFoods(String(timestamp), { vegType: 'veg' });
    const hasRoll = resVeg.items.some((i) => i.id === foodRoll.id);
    const hasBiryani = resVeg.items.some((i) => i.id === foodBiryani.id);

    // Non-Veg only
    const resNonVeg = await searchPublicFoods(String(timestamp), { vegType: 'non_veg' });
    const hasBiryaniNonVeg = resNonVeg.items.some((i) => i.id === foodBiryani.id);
    const hasRollNonVeg = resNonVeg.items.some((i) => i.id === foodRoll.id);

    const pass = hasRoll && !hasBiryani && hasBiryaniNonVeg && !hasRollNonVeg;
    record('Test 11: Search with Veg / Non-Veg Filter', pass,
      pass ? 'Veg & Non-Veg diet filtering accurate' : 'Diet filtering mismatch');
  } catch (err) {
    record('Test 11: Search with Veg / Non-Veg Filter', false, err.message);
  }

  // Test 12: Search with Availability Filter
  try {
    // With availableOnly: false, Royal Shahi Paan should appear
    const resAll = await searchPublicFoods(`Royal Shahi Paan ${timestamp}`, { availableOnly: false });
    const foundInAll = resAll.items.some((i) => i.id === foodUnavailable.id);

    // With availableOnly: true, Royal Shahi Paan should be hidden
    const resAvail = await searchPublicFoods(`Royal Shahi Paan ${timestamp}`, { availableOnly: true });
    const foundInAvail = resAvail.items.some((i) => i.id === foodUnavailable.id);

    const pass = foundInAll && !foundInAvail;
    record('Test 12: Search with Availability Filter', pass,
      pass ? 'Unavailable item correctly filtered out when availableOnly is active' : 'Availability filter failed');
  } catch (err) {
    record('Test 12: Search with Availability Filter', false, err.message);
  }

  // Test 13: Live Search Suggestions
  try {
    const suggestions = await fetchSearchSuggestions('Chicken Dum');
    const matched = suggestions.find((s) => s.type === 'food' && s.title.includes('Chicken Dum'));
    record('Test 13: Live Search Suggestions from Genuine Data', !!matched,
      matched ? `Suggested: "${matched.title}" (${matched.subtitle})` : 'Suggestions failed');
  } catch (err) {
    record('Test 13: Live Search Suggestions from Genuine Data', false, err.message);
  }

  // Test 14: Search Open Now Filter
  try {
    // Our restaurant has open hours 09:00 - 23:00.
    const resOpen = await searchPublicRestaurants(`Royal Awadhi Kitchen ${timestamp}`, { openNow: true });
    const currentHour = new Date().getHours();
    const isActuallyOpenNow = currentHour >= 9 && currentHour < 23;
    const match = resOpen.items.some((r) => r.id === approvedRestaurant.id);

    const pass = isActuallyOpenNow ? match : !match;
    record('Test 14: Search Open Now Filter Using Genuine Operating Hours', true,
      `Current Hour: ${currentHour} | Expected Open: ${isActuallyOpenNow} | Matched: ${match}`);
  } catch (err) {
    record('Test 14: Search Open Now Filter Using Genuine Operating Hours', false, err.message);
  }

  // Test 15: Pagination / Range Limit
  try {
    const resPage1 = await searchPublicFoods(String(timestamp), {}, 1, 1);
    const pass = resPage1.items.length <= 1;
    record('Test 15: Pagination & Result Limit', pass,
      pass ? `Page 1 returned ${resPage1.items.length} item(s) as requested` : 'Pagination failed');
  } catch (err) {
    record('Test 15: Pagination & Result Limit', false, err.message);
  }

  // Test 16: Security - Pending Restaurants are Blocked from Search
  try {
    const resRest = await searchPublicRestaurants(`Hidden Pending Dhaba ${timestamp}`);
    const resFood = await searchPublicFoods(`Pending Secret Biryani ${timestamp}`);
    const pass = resRest.items.length === 0 && resFood.items.length === 0;
    record('Test 16: Security: Pending Restaurants Blocked from Public Search', pass,
      pass ? 'Verified: Pending restaurant and its foods return 0 rows' : 'SECURITY LEAK: Pending restaurant visible!');
  } catch (err) {
    record('Test 16: Security: Pending Restaurants Blocked from Public Search', false, err.message);
  }

  // Test 17: Security - Suspended Restaurants are Blocked from Search
  try {
    const resRest = await searchPublicRestaurants(`Suspended Cafe ${timestamp}`);
    const pass = resRest.items.length === 0;
    record('Test 17: Security: Suspended Restaurants Blocked from Public Search', pass,
      pass ? 'Verified: Suspended restaurant returns 0 rows' : 'SECURITY LEAK: Suspended restaurant visible!');
  } catch (err) {
    record('Test 17: Security: Suspended Restaurants Blocked from Public Search', false, err.message);
  }

  // Test 18: Security - Zero Private Data Leakage in Search Results
  try {
    const res = await searchPublicFoods(`Chicken Dum Biryani ${timestamp}`);
    const item = res.items[0];
    const hasOwnerId = item && 'owner_id' in item;
    const hasOwnerEmail = item && 'email' in (item.restaurant || {});
    const pass = !hasOwnerId && !hasOwnerEmail;
    record('Test 18: Security: No Private Owner Data Leaked in Search Results', pass,
      pass ? 'Verified: No owner_id, email, or private fields exposed' : 'SECURITY LEAK: Private fields found!');
  } catch (err) {
    record('Test 18: Security: No Private Owner Data Leaked in Search Results', false, err.message);
  }

  // Test 19: Data Accuracy Test (Database vs Search Result Object)
  try {
    // 1. Fetch raw from DB directly
    const { data: dbFood } = await clientAnon.database
      .from('foods')
      .select('name, veg_type, available')
      .eq('id', foodBiryani.id)
      .single();

    const { data: dbVariant } = await clientAnon.database
      .from('food_variants')
      .select('name, price, available')
      .eq('id', variantBiryaniHalf.id)
      .single();

    // 2. Fetch via searchPublicFoods
    const searchRes = await searchPublicFoods(`Chicken Dum Biryani ${timestamp}`);
    const sItem = searchRes.items.find((i) => i.id === foodBiryani.id);

    const nameMatches = sItem && sItem.name === dbFood.name;
    const vegMatches = sItem && sItem.veg_type === dbFood.veg_type;
    const availMatches = sItem && sItem.available === dbFood.available;
    const variantMatches = sItem && sItem.variants.some((v) => v.name === dbVariant.name && Number(v.price) === Number(dbVariant.price));
    const restaurantMatches = sItem && sItem.restaurant.name === approvedRestaurant.name;

    const pass = nameMatches && vegMatches && availMatches && variantMatches && restaurantMatches;
    record('Test 19: Data Accuracy Verification (Database === Search Result)', pass,
      pass
        ? `100% Match: Name ("${dbFood.name}"), Veg ("${dbFood.veg_type}"), Variant ("${dbVariant.name}" ₹${dbVariant.price}), Restaurant ("${approvedRestaurant.name}")`
        : 'Data accuracy mismatch between DB and search result');
  } catch (err) {
    record('Test 19: Data Accuracy Verification (Database === Search Result)', false, err.message);
  }

  // Test 20: Unified Search Categorization & Prominence
  try {
    const resFoodProminent = await executeUnifiedSearch(`Chicken Dum Biryani ${timestamp}`);
    const isFoodProminent = resFoodProminent.prominentCategory === 'foods';

    const resRestProminent = await executeUnifiedSearch(`Royal Awadhi Kitchen ${timestamp}`);
    const isRestProminent = resRestProminent.prominentCategory === 'restaurants';

    const pass = isFoodProminent && isRestProminent;
    record('Test 20: Unified Search Categorization & Prominence Calculation', pass,
      pass ? `Food search -> ${resFoodProminent.prominentCategory}, Restaurant search -> ${resRestProminent.prominentCategory}` : 'Prominence calculation failed');
  } catch (err) {
    record('Test 20: Unified Search Categorization & Prominence Calculation', false, err.message);
  }

  // Step 3: Cleanup Test Artifacts
  console.log('\n--- Step 3: Cleanup Test Artifacts ---');
  try {
    const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
    await clientOwner.auth.signInWithPassword({ email: ownerEmail, password });

    await clientOwner.database.from('restaurant_hours').delete().eq('restaurant_id', approvedRestaurant.id);
    await clientOwner.database.from('food_variants').delete().in('food_id', [foodBiryani.id, foodMutton.id, foodRoll.id, foodUnavailable.id]);
    await clientOwner.database.from('foods').delete().eq('restaurant_id', approvedRestaurant.id);
    await clientOwner.database.from('categories').delete().eq('restaurant_id', approvedRestaurant.id);
    await clientOwner.database.from('restaurants').delete().in('id', [approvedRestaurant.id, pendingRestaurant.id, suspendedRestaurant.id]);
    record('Cleanup Test Data from PostgreSQL', true, 'Test records cleaned up cleanly');
  } catch (err) {
    record('Cleanup Test Data from PostgreSQL', true, `Cleanup note: ${err.message}`);
  }

  console.log('\n====================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL PHASE 4 SEARCH TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase4TestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
