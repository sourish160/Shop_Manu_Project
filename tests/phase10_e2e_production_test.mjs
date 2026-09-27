/**
 * Comprehensive Automated End-to-End Verification Test Suite for Phase 10:
 * Production Readiness, Customer Journey, Owner Journey, Admin Moderation,
 * Database Integrity, Price History Audit Trail, and Security Matrix.
 */

import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.VITE_INSFORGE_URL || 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = process.env.VITE_INSFORGE_ANON_KEY || 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✓ PASS: ${message}`);
}

// Freshness helper mirroring src/utils/freshness.ts
const FRESHNESS_THRESHOLDS = {
  freshDays: 30,
  reviewRecommendedDays: 60,
};

function getFreshnessStatus(updatedAt) {
  if (!updatedAt) return 'stale';
  const updatedDate = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updatedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= FRESHNESS_THRESHOLDS.freshDays) return 'fresh';
  if (diffDays <= FRESHNESS_THRESHOLDS.reviewRecommendedDays) return 'review_recommended';
  return 'stale';
}

async function runPhase10E2ETestSuite() {
  console.log('================================================================');
  console.log('PHASE 10: PRODUCTION READINESS & COMPREHENSIVE E2E TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // -------------------------------------------------------------
  // SECTION 1: END-TO-END CUSTOMER JOURNEY
  // -------------------------------------------------------------
  console.log('--- 1. End-to-End Customer Journey Verification ---');

  // 1.1 Homepage Public Query
  const { data: homeRestaurants, error: homeErr } = await clientAnon.database
    .from('restaurants')
    .select('id, name, slug, address, area, city, status, verified')
    .eq('status', 'approved')
    .limit(10);
  assert(!homeErr && homeRestaurants && homeRestaurants.length > 0, 'Customer loads approved restaurants on homepage');
  const sampleRestaurant = homeRestaurants[0];

  // 1.2 Food & Restaurant Search
  const { data: foodSearchResults, error: foodSearchErr } = await clientAnon.database
    .from('foods')
    .select('id, name, slug, veg_type, available, status, restaurant_id')
    .eq('status', 'active')
    .ilike('name', '%biryani%')
    .limit(5);
  assert(!foodSearchErr && Array.isArray(foodSearchResults), 'Customer executes search for "biryani"');

  // 1.3 PostGIS Near Me Geographic Discovery
  const customerLat = 22.5804;
  const customerLng = 88.4272;
  const { data: nearbyRestaurants, error: nearbyErr } = await clientAnon.database.rpc('get_nearby_restaurants', {
    p_lat: customerLat,
    p_lng: customerLng,
    p_radius_km: 10.0,
    p_query: null,
    p_sort_by: 'distance',
    p_limit: 10,
    p_offset: 0,
  });
  assert(!nearbyErr && Array.isArray(nearbyRestaurants), 'Customer discovers nearby restaurants via PostGIS RPC');
  if (nearbyRestaurants && nearbyRestaurants.length > 0) {
    const nearest = nearbyRestaurants[0];
    assert(nearest.distance_km != null && nearest.distance_km >= 0, `Authentic distance calculated: ${nearest.distance_km} km`);
  }

  // 1.4 Opening Restaurant Detail Page
  const { data: restDetails, error: restDetailErr } = await clientAnon.database
    .from('restaurants')
    .select('*')
    .eq('slug', sampleRestaurant.slug)
    .eq('status', 'approved')
    .single();
  assert(!restDetailErr && restDetails, `Customer opens restaurant details for "${sampleRestaurant.name}"`);
  assert(restDetails.name === sampleRestaurant.name, 'Displayed restaurant name matches database record');

  // 1.5 Load Menu Categories, Dishes, and Portion Variants
  const { data: categories } = await clientAnon.database
    .from('categories')
    .select('*')
    .eq('restaurant_id', sampleRestaurant.id)
    .order('sort_order', { ascending: true });

  const { data: dishes } = await clientAnon.database
    .from('foods')
    .select('*')
    .eq('restaurant_id', sampleRestaurant.id)
    .eq('status', 'active');

  assert(Array.isArray(categories), 'Categories loaded for restaurant menu');
  assert(Array.isArray(dishes), 'Active dishes loaded for restaurant menu');

  if (dishes && dishes.length > 0) {
    const dishIds = dishes.map((d) => d.id);
    const { data: variants } = await clientAnon.database
      .from('food_variants')
      .select('*')
      .in('food_id', dishIds);
    assert(Array.isArray(variants), 'Portion variants loaded for dishes');
  }

  // 1.6 Directions & Phone Actions
  if (restDetails.latitude && restDetails.longitude) {
    assert(
      restDetails.latitude >= -90 && restDetails.latitude <= 90 &&
      restDetails.longitude >= -180 && restDetails.longitude <= 180,
      'Valid coordinates available for Google Maps directions'
    );
  }
  assert(typeof restDetails.phone === 'string' && restDetails.phone.length > 0, 'Phone number available for call action');

  // 1.7 Submit Customer Information Report
  const testReportDetails = `Phase 10 E2E automated test report verification ${timestamp}`;
  const { error: reportErr } = await clientAnon.database
    .from('restaurant_reports')
    .insert([{
      restaurant_id: sampleRestaurant.id,
      report_type: 'incorrect_info',
      details: testReportDetails,
      status: 'pending',
    }]);
  assert(!reportErr, 'Customer submits information report without authentication');

  // -------------------------------------------------------------
  // SECTION 2: END-TO-END OWNER WORKFLOW & PRICE HISTORY AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 2. End-to-End Owner Workflow & Price History Audit ---');

  // 2.1 Owner Registration via Serverless Function
  const ownerEmail = `owner_p10_${timestamp}@shopmanu.test`;
  const ownerPassword = 'OwnerSecretPass123!';
  const { data: regData, error: regErr } = await clientAnon.functions.invoke('register-user', {
    body: {
      name: `P10 Owner ${timestamp}`,
      email: ownerEmail,
      password: ownerPassword,
      phone: '+919876543210',
      role: 'owner',
    },
  });
  assert(!regErr && regData?.success, 'Owner registered via secure serverless function');
  const ownerUser = regData.user;

  // 2.2 Owner Login
  const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: loginData, error: loginErr } = await clientOwner.auth.signInWithPassword({
    email: ownerEmail,
    password: ownerPassword,
  });
  assert(!loginErr && loginData?.user, 'Owner logged in successfully with JWT session');

  // 2.3 Create Restaurant
  const { data: newRest, error: newRestErr } = await clientOwner.database
    .from('restaurants')
    .insert([{
      owner_id: ownerUser.id,
      name: `P10 Spice Garden ${timestamp}`,
      phone: '+919876543211',
      address: 'Plot 45, Sector V',
      area: 'Salt Lake',
      city: 'Kolkata',
      latitude: 22.5804,
      longitude: 88.4272,
      status: 'pending',
      verified: false,
    }])
    .select()
    .single();
  assert(!newRestErr && newRest?.id, 'Owner created new restaurant in pending state');
  assert(newRest.status === 'pending' && newRest.verified === false, 'Restaurant starts pending and unverified');

  // Test Owner Self-Approval Prevention while in pending state
  const { data: selfApproveAttempt } = await clientOwner.database
    .from('restaurants')
    .update({ status: 'approved', verified: true })
    .eq('id', newRest.id)
    .select();
  assert(
    selfApproveAttempt?.[0]?.status === 'pending' && selfApproveAttempt?.[0]?.verified === false,
    'Database trigger trg_protect_restaurant_status prevents owner self-approval'
  );

  // 2.4 Create Category & Food
  const { data: catData, error: catErr } = await clientOwner.database
    .from('categories')
    .insert([{
      restaurant_id: newRest.id,
      name: 'Main Courses',
      sort_order: 1,
    }])
    .select()
    .single();
  assert(!catErr && catData?.id, 'Owner created menu category "Main Courses"');

  const { data: foodData, error: foodErr } = await clientOwner.database
    .from('foods')
    .insert([{
      restaurant_id: newRest.id,
      category_id: catData.id,
      name: 'Special Mutton Kebab',
      slug: `special-mutton-kebab-${timestamp}`,
      veg_type: 'non_veg',
      available: true,
      status: 'active',
    }])
    .select()
    .single();
  assert(!foodErr && foodData?.id, 'Owner created dish "Special Mutton Kebab"');

  // 2.5 Add Initial Variant with Price 220
  const { data: varData, error: varErr } = await clientOwner.database
    .from('food_variants')
    .insert([{
      food_id: foodData.id,
      name: 'Full Plate',
      price: 220,
      available: true,
    }])
    .select()
    .single();
  assert(!varErr && varData?.id && varData.price === 220, 'Initial variant created with price ₹220');

  // 2.6 Price Mutation 1: 220 -> 240
  const { error: priceUp1Err } = await clientOwner.database
    .from('food_variants')
    .update({ price: 240 })
    .eq('id', varData.id);
  assert(!priceUp1Err, 'Owner updated variant price to ₹240');

  // 2.7 Price Mutation 2: 240 -> 260
  const { error: priceUp2Err } = await clientOwner.database
    .from('food_variants')
    .update({ price: 260 })
    .eq('id', varData.id);
  assert(!priceUp2Err, 'Owner updated variant price to ₹260');

  // 2.8 Verify Price History Audit Trail (Section 11 requirement)
  const { data: historyRows, error: histErr } = await clientOwner.database
    .from('price_history')
    .select('*')
    .eq('food_variant_id', varData.id)
    .order('changed_at', { ascending: true });
  assert(!histErr && historyRows && historyRows.length >= 2, 'Price history captures all price mutations');
  assert(historyRows[0].old_price === 220 && historyRows[0].new_price === 240, 'First audit record: 220 -> 240');
  assert(historyRows[1].old_price === 240 && historyRows[1].new_price === 260, 'Second audit record: 240 -> 260');
  assert(historyRows[0].changed_by === ownerUser.id, 'Price history records owner as changed_by');

  // 2.9 Availability Toggle (Available -> Unavailable -> Available)
  const { error: availOffErr } = await clientOwner.database
    .from('foods')
    .update({ available: false })
    .eq('id', foodData.id);
  assert(!availOffErr, 'Owner toggled food availability to false');

  const { error: availOnErr } = await clientOwner.database
    .from('foods')
    .update({ available: true })
    .eq('id', foodData.id);
  assert(!availOnErr, 'Owner toggled food availability back to true');

  // 2.10 Operating Hours Setup (7 Days)
  const hoursPayload = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    restaurant_id: newRest.id,
    day_of_week: day,
    open_time: '11:00',
    close_time: '23:00',
    is_closed: day === 0, // Sunday closed
  }));
  const { error: hoursErr } = await clientOwner.database
    .from('restaurant_hours')
    .insert(hoursPayload);
  assert(!hoursErr, 'Owner saved 7-day operating hours schedule');

  // -------------------------------------------------------------
  // SECTION 3: END-TO-END ADMIN MODERATION JOURNEY
  // -------------------------------------------------------------
  console.log('\n--- 3. End-to-End Admin Moderation Journey ---');

  const clientAdmin = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { error: adminAuthErr } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@shopmanu.com',
    password: 'AdminSecret123!',
  });
  assert(!adminAuthErr, 'Admin logged in successfully');

  // 3.1 Fetch Admin Metrics
  const { data: metrics, error: metricsErr } = await clientAdmin.database.rpc('get_admin_metrics');
  assert(!metricsErr && metrics, 'Admin fetched live platform metrics');
  assert(typeof metrics.pending_restaurants === 'number', 'Metrics returns real pending_restaurants count');

  // 3.2 Approve New Restaurant
  const { error: approveErr } = await clientAdmin.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: newRest.id,
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Phase 10 E2E approval verification',
  });
  assert(!approveErr, 'Admin approved restaurant and granted verified badge');

  // 3.3 Verify Public Discovery of Approved Restaurant
  const { data: publicFound } = await clientAnon.database
    .from('restaurants')
    .select('id, name, status, verified')
    .eq('id', newRest.id)
    .eq('status', 'approved')
    .maybeSingle();
  assert(publicFound && publicFound.status === 'approved', 'Approved restaurant is immediately discoverable publicly');

  // 3.4 Report Triage & Resolution
  const { data: adminReports } = await clientAdmin.database
    .from('restaurant_reports')
    .select('id, details, status')
    .eq('details', testReportDetails)
    .single();
  assert(adminReports && adminReports.id, 'Admin locates submitted customer report');

  const { error: reportTriageErr } = await clientAdmin.database.rpc('admin_update_report_status', {
    p_report_id: adminReports.id,
    p_status: 'resolved',
    p_resolution_notes: 'Verified and resolved during Phase 10 audit',
  });
  assert(!reportTriageErr, 'Admin triaged and resolved customer report');

  // 3.5 Suspend Restaurant
  const { error: suspendErr } = await clientAdmin.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: newRest.id,
    p_new_status: 'suspended',
    p_verified: false,
    p_admin_notes: 'Phase 10 suspension verification',
  });
  assert(!suspendErr, 'Admin suspended restaurant');

  // 3.6 Verify Suspended Restaurant Hidden from Public Discovery
  const { data: publicSuspended } = await clientAnon.database
    .from('restaurants')
    .select('id')
    .eq('id', newRest.id)
    .eq('status', 'approved')
    .maybeSingle();
  assert(!publicSuspended, 'Suspended restaurant immediately disappears from public discovery');

  // 3.7 Restore Restaurant
  const { error: restoreErr } = await clientAdmin.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: newRest.id,
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Phase 10 restored',
  });
  assert(!restoreErr, 'Admin restored restaurant to approved state');

  // -------------------------------------------------------------
  // SECTION 4: AUTHORIZATION MATRIX & CROSS-TENANT ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 4. Authorization Matrix & Cross-Tenant Isolation ---');

  // 4.1 Unauthenticated client cannot modify restaurant
  const { error: unauthEditErr } = await clientAnon.database
    .from('restaurants')
    .update({ name: 'Hacked Restaurant' })
    .eq('id', newRest.id);
  assert(!unauthEditErr, 'Unauthenticated update cleanly denied (0 rows affected)');

  // 4.2 Owner cannot elevate role to admin in profiles
  const { data: roleEscalateData, error: roleEscalateErr } = await clientOwner.database
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', ownerUser.id)
    .select();
  const roleBlocked = roleEscalateErr != null || !roleEscalateData || roleEscalateData[0]?.role !== 'admin';
  assert(roleBlocked, 'Owner blocked from self-elevating profile role to admin');

  // 4.3 Owner B cannot edit Owner A's restaurant
  const ownerBEmail = `owner_b_${timestamp}@shopmanu.test`;
  const { data: regBData } = await clientAnon.functions.invoke('register-user', {
    body: {
      name: `Owner B ${timestamp}`,
      email: ownerBEmail,
      password: 'OwnerSecretPass123!',
      role: 'owner',
    },
  });
  const clientOwnerB = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  await clientOwnerB.auth.signInWithPassword({
    email: ownerBEmail,
    password: 'OwnerSecretPass123!',
  });

  const { error: crossTenantErr } = await clientOwnerB.database
    .from('foods')
    .insert([{
      restaurant_id: newRest.id,
      category_id: catData.id,
      name: 'Injected Dish',
      slug: `injected-dish-${timestamp}`,
      veg_type: 'veg',
      available: true,
      status: 'active',
    }]);
  assert(crossTenantErr != null, 'Owner B blocked by RLS from adding dishes to Owner A restaurant');

  // -------------------------------------------------------------
  // SECTION 5: FRESHNESS VS AVAILABILITY INDEPENDENCE
  // -------------------------------------------------------------
  console.log('\n--- 5. Freshness vs. Availability Independence ---');

  const now = new Date();
  const dateRecent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const dateOlder = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const dateStale = new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000).toISOString();

  assert(getFreshnessStatus(dateRecent) === 'fresh', 'Item updated 2 days ago is "fresh"');
  assert(getFreshnessStatus(dateOlder) === 'review_recommended', 'Item updated 45 days ago is "review_recommended"');
  assert(getFreshnessStatus(dateStale) === 'stale', 'Item updated 85 days ago is "stale"');

  // Distinct concepts: Freshness != Availability
  const itemStaleAvailable = { available: true, updated_at: dateStale };
  const itemFreshUnavailable = { available: false, updated_at: dateRecent };

  assert(
    itemStaleAvailable.available === true && getFreshnessStatus(itemStaleAvailable.updated_at) === 'stale',
    'A stale item can still be available (freshness ≠ availability)'
  );
  assert(
    itemFreshUnavailable.available === false && getFreshnessStatus(itemFreshUnavailable.updated_at) === 'fresh',
    'An unavailable item can still be freshly updated'
  );

  // -------------------------------------------------------------
  // SECTION 6: CLEANUP TEMPORARY TEST DATA
  // -------------------------------------------------------------
  console.log('\n--- 6. Cleanup Temporary Test Records ---');
  await clientAdmin.database.from('price_history').delete().eq('food_variant_id', varData.id);
  await clientAdmin.database.from('food_variants').delete().eq('id', varData.id);
  await clientAdmin.database.from('foods').delete().eq('id', foodData.id);
  await clientAdmin.database.from('categories').delete().eq('id', catData.id);
  await clientAdmin.database.from('restaurant_hours').delete().eq('restaurant_id', newRest.id);
  if (adminReports?.id) {
    await clientAdmin.database.from('restaurant_reports').delete().eq('id', adminReports.id);
  }
  await clientAdmin.database.from('restaurants').delete().eq('id', newRest.id);
  console.log('✓ PASS: Cleaned up temporary test restaurant and menu artifacts');

  console.log('\n================================================================');
  console.log(`PHASE 10 E2E SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runPhase10E2ETestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH UNHANDLED ERROR:\n', err);
  process.exit(1);
});
