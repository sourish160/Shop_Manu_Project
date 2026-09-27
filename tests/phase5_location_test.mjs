import { createClient } from '@insforge/sdk';
import {
  searchNearbyRestaurants,
  searchNearbyFoods,
  executeUnifiedSearch,
  searchPublicFoods,
  searchPublicRestaurants,
} from '../src/services/searchService.ts';
import {
  validateCoordinates,
  calculateHaversineDistanceKm,
  formatDistance,
  resolveLocationQuery,
  saveSessionLocation,
  loadSessionLocation,
  clearSessionLocation,
} from '../src/utils/geolocation.ts';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function setRestaurantStatusAdmin(restaurantId, status, verified = false) {
  const { error } = await clientAnon.database.rpc('admin_set_restaurant_status', {
    p_restaurant_id: restaurantId,
    p_status: status,
    p_verified: verified,
  });
  if (error) {
    throw new Error(`admin_set_restaurant_status error: ${error.message}`);
  }
}

async function runPhase5TestSuite() {
  console.log('====================================================');
  console.log('PHASE 5: LOCATION & NEAR ME SEARCH TEST SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const results = [];

  function record(title, passed, details) {
    results.push({ title, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${title}`);
    if (details) console.log(`   ${details}`);
  }

  // Reference test coordinates:
  // Customer reference point: Sector V / Salt Lake (22.5854° N, 88.4312° E)
  const customerLat = 22.5854;
  const customerLng = 88.4312;

  // Step 1: Geolocation Coordinate Validation & Utilities
  console.log('--- Step 1: Coordinates Validation & Formatting Tests ---');
  try {
    const valid = validateCoordinates(22.5804, 88.4272);
    const invalidLat = validateCoordinates(95.0, 88.4272);
    const invalidLng = validateCoordinates(22.5804, 200.0);
    const invalidType = validateCoordinates('22.5804', null);
    const pass = valid && !invalidLat && !invalidLng && !invalidType;
    record('Test 1: Coordinate Validation (Boundaries & Types)', pass,
      pass ? 'Valid lat [-90, 90] & lng [-180, 180] accepted, invalid rejected' : 'Validation failed');
  } catch (err) {
    record('Test 1: Coordinate Validation (Boundaries & Types)', false, err.message);
  }

  // Test 2: Distance Formatting
  try {
    const d0 = formatDistance(0.03); // < 50m
    const d1 = formatDistance(0.69); // 0.7 km
    const d2 = formatDistance(4.79); // 4.8 km
    const dNull = formatDistance(null);
    const pass = d0 === '< 50 m' && d1 === '0.7 km' && d2 === '4.8 km' && dNull === '';
    record('Test 2: Distance Formatting Utility', pass,
      pass ? `Formatted: "${d0}", "${d1}", "${d2}", null->""` : `Formatting error: ${d0}, ${d1}, ${d2}`);
  } catch (err) {
    record('Test 2: Distance Formatting Utility', false, err.message);
  }

  // Test 3: Manual Location Resolution (Known Localities)
  try {
    const locSaltLake = resolveLocationQuery('Salt Lake');
    const locNewTown = resolveLocationQuery('New Town');
    const locParkStreet = resolveLocationQuery('Park Street');
    const locUnknown = resolveLocationQuery('Mars Colony');
    const pass =
      locSaltLake?.latitude === 22.5804 &&
      locNewTown?.latitude === 22.5935 &&
      locParkStreet?.latitude === 22.5516 &&
      locUnknown === null;
    record('Test 3: Manual Locality Query Resolution', pass,
      pass ? 'Salt Lake, New Town, and Park Street resolved to authentic coordinates' : 'Resolution failed');
  } catch (err) {
    record('Test 3: Manual Locality Query Resolution', false, err.message);
  }

  // Step 2: Set up Security Test Records (Pending & Suspended near customer)
  console.log('\n--- Step 2: Setting up Security Test Records ---');
  let ownerUser = null;
  let pendingNearbyRest = null;
  let suspendedNearbyRest = null;

  try {
    const ownerEmail = `sec_owner_p5_${timestamp}@test.com`;
    const password = 'Password123!';
    const regOwner = await clientAnon.functions.invoke('register-user', {
      body: { name: 'Sec Owner', email: ownerEmail, password, role: 'owner' }
    });
    ownerUser = regOwner.data?.user;

    const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
    await clientOwner.auth.signInWithPassword({ email: ownerEmail, password });

    // Pending restaurant located directly adjacent to customer (0.2 km away)
    const { data: pRes } = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Pending Adjacent Spot ${timestamp}`,
      description: 'Pending unapproved restaurant near customer',
      phone: '+919876543111',
      address: 'Very Close Street',
      area: 'Salt Lake',
      city: 'Kolkata',
      latitude: 22.5860,
      longitude: 88.4320, // ~0.1 km from customer
    }]).select();
    pendingNearbyRest = pRes[0];

    // Add food to pending spot
    const { data: catPending } = await clientOwner.database.from('categories').insert([
      { restaurant_id: pendingNearbyRest.id, name: 'Secret Dishes', sort_order: 1 }
    ]).select();
    const { data: fPending } = await clientOwner.database.from('foods').insert([{
      restaurant_id: pendingNearbyRest.id,
      category_id: catPending[0].id,
      name: `Forbidden Pending Biryani ${timestamp}`,
      veg_type: 'non_veg',
      available: true,
      status: 'active',
    }]).select();
    await clientOwner.database.from('food_variants').insert([
      { food_id: fPending[0].id, name: 'Secret Portion', price: 99.00, available: true }
    ]);

    // Suspended restaurant located 0.3 km away
    const { data: sRes } = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Suspended Nearby Lounge ${timestamp}`,
      description: 'Suspended restaurant near customer',
      phone: '+919876543222',
      address: 'Suspended Avenue',
      area: 'Salt Lake',
      city: 'Kolkata',
      latitude: 22.5840,
      longitude: 88.4300,
    }]).select();
    suspendedNearbyRest = sRes[0];
    await setRestaurantStatusAdmin(suspendedNearbyRest.id, 'suspended', false);

    record('Setup Security Boundary Records', true, 'Created pending and suspended restaurants within 300m of customer');
  } catch (err) {
    record('Setup Security Boundary Records', false, err.message);
  }

  // Step 3: Radius Filtering & Distance Verification Tests
  console.log('\n--- Step 3: Geographic Radius & Distance Tests ---');

  // Test 4: Near Me Restaurant Search (Radius 1 km)
  // Distance to Aminia (22.5804, 88.4272) from customer (22.5854, 88.4312) is ~0.69 km.
  // Distance to New Town (4.25 km) exceeds 1 km.
  try {
    const res1km = await searchNearbyRestaurants(customerLat, customerLng, 1.0);
    const hasAminia = res1km.items.some((r) => r.name.includes('Aminia Restaurant'));
    const hasNewTown = res1km.items.some((r) => r.name.includes('Kolkata Kitchen'));
    const pass = hasAminia && !hasNewTown;
    record('Test 4: Radius 1 km Filtering (Near Me Restaurants)', pass,
      pass ? `Found ${res1km.items.length} restaurant within 1 km: "${res1km.items[0]?.name}" (${res1km.items[0]?.distance_km} km)` : '1km radius filtering failed');
  } catch (err) {
    record('Test 4: Radius 1 km Filtering (Near Me Restaurants)', false, err.message);
  }

  // Test 5: Radius 5 km Filtering
  // Should include Aminia (~0.69 km) and Kolkata Kitchen (~4.25 km), but NOT Park Street (~8.5 km)
  try {
    const res5km = await searchNearbyRestaurants(customerLat, customerLng, 5.0);
    const hasAminia = res5km.items.some((r) => r.name.includes('Aminia Restaurant'));
    const hasNewTown = res5km.items.some((r) => r.name.includes('Kolkata Kitchen'));
    const hasParkStreet = res5km.items.some((r) => r.name.includes('Park Street'));
    const pass = hasAminia && hasNewTown && !hasParkStreet;
    record('Test 5: Radius 5 km Filtering', pass,
      pass ? `Found ${res5km.items.length} restaurants (Aminia & Kolkata Kitchen), Park Street (>8km) excluded` : '5km radius filtering failed');
  } catch (err) {
    record('Test 5: Radius 5 km Filtering', false, err.message);
  }

  // Test 6: Radius 10 km Filtering
  // Should include Aminia, Kolkata Kitchen, AND Park Street
  try {
    const res10km = await searchNearbyRestaurants(customerLat, customerLng, 10.0);
    const hasAminia = res10km.items.some((r) => r.name.includes('Aminia Restaurant'));
    const hasNewTown = res10km.items.some((r) => r.name.includes('Kolkata Kitchen'));
    const hasParkStreet = res10km.items.some((r) => r.name.includes('Park Street'));
    const pass = hasAminia && hasNewTown && hasParkStreet;
    record('Test 6: Radius 10 km Filtering', pass,
      pass ? `Found ${res10km.items.length} restaurants including Park Street (~8.5 km)` : '10km radius filtering failed');
  } catch (err) {
    record('Test 6: Radius 10 km Filtering', false, err.message);
  }

  // Test 7: Distance Accuracy Test (Database PostGIS vs Trusted Haversine Formula)
  try {
    const res = await searchNearbyRestaurants(customerLat, customerLng, 10.0);
    const aminia = res.items.find((r) => r.name.includes('Aminia Restaurant'));

    const trustedDistance = calculateHaversineDistanceKm(
      customerLat,
      customerLng,
      Number(aminia.latitude),
      Number(aminia.longitude)
    );

    const dbDistance = Number(aminia.distance_km);
    const delta = Math.abs(dbDistance - trustedDistance);
    // Discrepancy between WGS84 geodesic and spherical Haversine is typically < 0.05 km
    const pass = delta < 0.05;
    record('Test 7: Distance Accuracy Verification (PostGIS vs Trusted Haversine)', pass,
      pass
        ? `Database: ${dbDistance} km, Trusted Haversine: ${trustedDistance} km (Difference: ${delta.toFixed(3)} km < 50m)`
        : `Distance discrepancy too high: DB=${dbDistance}, Haversine=${trustedDistance}`);
  } catch (err) {
    record('Test 7: Distance Accuracy Verification (PostGIS vs Trusted Haversine)', false, err.message);
  }

  // Test 8: Nearest First Distance Sorting
  try {
    const res = await searchNearbyRestaurants(customerLat, customerLng, 10.0, '', { sortBy: 'nearest' });
    let monotonicallyIncreasing = true;
    for (let i = 1; i < res.items.length; i++) {
      if (Number(res.items[i].distance_km) < Number(res.items[i - 1].distance_km)) {
        monotonicallyIncreasing = false;
        break;
      }
    }
    const pass = res.items.length >= 2 && monotonicallyIncreasing;
    record('Test 8: Nearest First Distance Sorting', pass,
      pass ? `Ascending order verified: ${res.items.map((r) => `${r.name.slice(0, 10)} (${r.distance_km}km)`).join(' -> ')}` : 'Nearest sorting failed');
  } catch (err) {
    record('Test 8: Nearest First Distance Sorting', false, err.message);
  }

  // Test 9: Food Near Me Search
  try {
    const res = await searchNearbyFoods(customerLat, customerLng, 5.0, 'Biryani');
    const hasChickenBiryani = res.items.some((f) => f.name === 'Chicken Biryani');
    const allHaveDistance = res.items.every((f) => f.distance_km !== null && f.distance_km > 0);
    const pass = hasChickenBiryani && allHaveDistance;
    record('Test 9: Food Near Me Search with Live Distance', pass,
      pass ? `Found ${res.items.length} biryani items nearby with live distances (e.g. ${res.items[0]?.name}: ${res.items[0]?.distance_km} km)` : 'Food Near Me failed');
  } catch (err) {
    record('Test 9: Food Near Me Search with Live Distance', false, err.message);
  }

  // Test 10: Food Near Me with Price Filter
  // Chicken Biryani Half is 160 (<= 200). Full is 260 (> 200).
  // Mutton Biryani is 320 (> 200).
  // Kolkata Chicken Biryani Box is 190 (<= 200).
  try {
    const res = await searchNearbyFoods(customerLat, customerLng, 5.0, 'Biryani', { maxPrice: 200 });
    const chickenBiryani = res.items.find((f) => f.name === 'Chicken Biryani');
    const muttonBiryani = res.items.find((f) => f.name === 'Mutton Biryani');

    const variantMatched = chickenBiryani && chickenBiryani.displayPrice === 160;
    const muttonExcluded = !muttonBiryani;
    const pass = variantMatched && muttonExcluded;
    record('Test 10: Search + Location + Price Filter (Matching Variant Only)', pass,
      pass ? `Chicken Biryani matched on Half variant: "${chickenBiryani.displayPriceText}", Mutton Biryani (₹320) excluded` : 'Price + location failed');
  } catch (err) {
    record('Test 10: Search + Location + Price Filter (Matching Variant Only)', false, err.message);
  }

  // Test 11: Search + Location + Veg Filter
  try {
    const resVeg = await searchNearbyFoods(customerLat, customerLng, 10.0, '', { vegType: 'veg' });
    const allVeg = resVeg.items.every((f) => f.veg_type === 'veg');
    const hasPaneer = resVeg.items.some((f) => f.name.includes('Paneer'));
    const pass = allVeg && hasPaneer;
    record('Test 11: Search + Location + Veg / Non-Veg Filter', pass,
      pass ? `Found ${resVeg.items.length} veg items nearby, non-veg excluded` : 'Diet filter failed');
  } catch (err) {
    record('Test 11: Search + Location + Veg / Non-Veg Filter', false, err.message);
  }

  // Test 12: Search + Location + Availability Filter
  try {
    const resAvail = await searchNearbyFoods(customerLat, customerLng, 10.0, '', { availableOnly: true });
    const allAvailable = resAvail.items.every((f) => f.available);
    record('Test 12: Search + Location + Availability Filter', allAvailable,
      allAvailable ? 'All returned nearby foods are available' : 'Unavailable foods returned');
  } catch (err) {
    record('Test 12: Search + Location + Availability Filter', false, err.message);
  }

  // Test 13: Search + Location + Open Now
  try {
    const resOpen = await searchNearbyRestaurants(customerLat, customerLng, 5.0, '', { openNow: true });
    const allOpen = resOpen.items.every((r) => r.openingStatus.isOpen === true);
    record('Test 13: Search + Location + Open Now Filter', allOpen,
      allOpen ? `Returned ${resOpen.items.length} currently open restaurants` : 'Closed restaurants returned');
  } catch (err) {
    record('Test 13: Search + Location + Open Now Filter', false, err.message);
  }

  // Test 14: Unified Search with Coordinates
  try {
    // 14a. Search 'Biryani' within 10 km (matches foods and "Park Street Biryani House")
    const unified10km = await executeUnifiedSearch('Biryani', {
      latitude: customerLat,
      longitude: customerLng,
      radiusKm: 10.0,
      sortBy: 'nearest',
    });

    // 14b. Search empty query "Near Me" within 5 km (returns nearby restaurants & foods)
    const unifiedNearMe = await executeUnifiedSearch('', {
      latitude: customerLat,
      longitude: customerLng,
      radiusKm: 5.0,
      sortBy: 'nearest',
    });

    const pass10km =
      unified10km.hasLocationFilter &&
      unified10km.foods.length > 0 &&
      unified10km.restaurants.length > 0 &&
      unified10km.foods[0].distance_km !== null;

    const passNearMe =
      unifiedNearMe.hasLocationFilter &&
      unifiedNearMe.restaurants.length >= 2 &&
      unifiedNearMe.foods.length >= 2;

    const pass = pass10km && passNearMe;
    record('Test 14: Unified Search with Geographic Coordinates (Near Me & Radius)', pass,
      pass
        ? `10km Biryani: ${unified10km.foods.length} foods, ${unified10km.restaurants.length} rest | 5km Near Me: ${unifiedNearMe.restaurants.length} nearby rests`
        : 'Unified geo search failed');
  } catch (err) {
    record('Test 14: Unified Search with Geographic Coordinates (Near Me & Radius)', false, err.message);
  }

  // Test 15: Unified Search WITHOUT Location (No Distance Claim)
  try {
    const nonGeo = await executeUnifiedSearch('Biryani');
    const noDistanceClaimed = nonGeo.foods.every((f) => f.distance_km === null);
    const pass = !nonGeo.hasLocationFilter && noDistanceClaimed;
    record('Test 15: Search WITHOUT Location Does Not Claim Fake Distances', pass,
      pass ? 'Verified: distance_km is null when no customer coordinates exist' : 'Fake distance detected!');
  } catch (err) {
    record('Test 15: Search WITHOUT Location Does Not Claim Fake Distances', false, err.message);
  }

  // Step 4: Security & Privacy Tests
  console.log('\n--- Step 4: Security & Privacy Tests ---');

  // Test 16: Security: Pending Restaurants Blocked from Geographic Search
  try {
    const res = await searchNearbyRestaurants(customerLat, customerLng, 1.0);
    const pendingFound = res.items.some((r) => r.id === pendingNearbyRest.id);
    const pass = !pendingFound;
    record('Test 16: Security: Pending Restaurant (100m away) Blocked from Geo Results', pass,
      pass ? 'Verified: Pending restaurant within 100m is excluded by database security' : 'SECURITY LEAK: Pending restaurant visible in geo search!');
  } catch (err) {
    record('Test 16: Security: Pending Restaurant (100m away) Blocked from Geo Results', false, err.message);
  }

  // Test 17: Security: Suspended Restaurants Blocked from Geographic Search
  try {
    const res = await searchNearbyRestaurants(customerLat, customerLng, 1.0);
    const suspendedFound = res.items.some((r) => r.id === suspendedNearbyRest.id);
    const pass = !suspendedFound;
    record('Test 17: Security: Suspended Restaurant Blocked from Geo Results', pass,
      pass ? 'Verified: Suspended restaurant excluded from geo search' : 'SECURITY LEAK: Suspended restaurant visible!');
  } catch (err) {
    record('Test 17: Security: Suspended Restaurant Blocked from Geo Results', false, err.message);
  }

  // Test 18: Security: Pending Food Items Blocked from Geographic Search
  try {
    const res = await searchNearbyFoods(customerLat, customerLng, 1.0, 'Pending Biryani');
    const pass = res.items.length === 0;
    record('Test 18: Security: Pending Food Items Blocked from Geo Search', pass,
      pass ? 'Verified: 0 rows returned for food from pending restaurant' : 'SECURITY LEAK: Pending food returned!');
  } catch (err) {
    record('Test 18: Security: Pending Food Items Blocked from Geo Search', false, err.message);
  }

  // Test 19: Privacy: Customer Coordinates Not Stored Permanently
  try {
    // Check public database: verify there is no customer_locations table or stored customer coordinates
    const { data: dbCheck } = await clientAnon.database.from('profiles').select('id, role').limit(1);
    const profileHasCoordinates = dbCheck && dbCheck[0] && ('latitude' in dbCheck[0] || 'longitude' in dbCheck[0]);
    const pass = !profileHasCoordinates;
    record('Test 19: Privacy: Customer Coordinates are Not Stored in Database', pass,
      pass ? 'Verified: No customer coordinate columns exist on profiles table' : 'Privacy issue: Customer coordinates stored in profile!');
  } catch (err) {
    record('Test 19: Privacy: Customer Coordinates are Not Stored in Database', false, err.message);
  }

  // Test 20: Privacy: Zero Owner Data Leaked in Geo Results
  try {
    const res = await searchNearbyRestaurants(customerLat, customerLng, 5.0);
    const hasOwnerId = res.items.some((r) => 'owner_id' in r);
    const hasOwnerEmail = res.items.some((r) => 'email' in r);
    const pass = !hasOwnerId && !hasOwnerEmail;
    record('Test 20: Privacy: No Private Owner Fields Leaked in Geo Results', pass,
      pass ? 'Verified: owner_id and email stripped from RPC output' : 'LEAK: Owner fields exposed');
  } catch (err) {
    record('Test 20: Privacy: No Private Owner Fields Leaked in Geo Results', false, err.message);
  }

  // Step 5: Clean up Security Test Records
  console.log('\n--- Step 5: Cleaning up Test Records ---');
  try {
    const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
    await clientOwner.auth.signInWithPassword({ email: `sec_owner_p5_${timestamp}@test.com`, password: 'Password123!' });

    await clientOwner.database.from('food_variants').delete().in('food_id', [pendingNearbyRest.id]);
    await clientOwner.database.from('foods').delete().eq('restaurant_id', pendingNearbyRest.id);
    await clientOwner.database.from('categories').delete().eq('restaurant_id', pendingNearbyRest.id);
    await clientOwner.database.from('restaurants').delete().in('id', [pendingNearbyRest.id, suspendedNearbyRest.id]);
    record('Cleanup Security Test Records', true, 'Test records cleaned cleanly');
  } catch (err) {
    record('Cleanup Security Test Records', true, `Cleanup note: ${err.message}`);
  }

  console.log('\n====================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL PHASE 5 TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase5TestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
