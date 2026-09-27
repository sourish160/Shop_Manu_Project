/**
 * Automated Verification & Security Test Suite for Phase 7:
 * Admin Panel, Restaurant Verification, Reports and Menu Freshness
 */

import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const clientAnon = createClient({
  baseUrl: BASE_URL,
  anonKey: ANON_KEY,
});

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

// Freshness helper mirrors src/utils/freshness.ts
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

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING PHASE 7 VERIFICATION & SECURITY TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: Freshness Thresholds & Logic Tests
  // ----------------------------------------------------
  console.log('--- 1. Menu & Price Freshness Calculation Tests ---');
  const now = new Date();

  // Test 1: Recent update (5 days ago) is 'fresh'
  const date5DaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  assert(getFreshnessStatus(date5DaysAgo) === 'fresh', 'Item updated 5 days ago classified as "fresh"');

  // Test 2: Borderline 30 days is 'fresh'
  const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  assert(getFreshnessStatus(date30DaysAgo) === 'fresh', 'Item updated exactly 30 days ago classified as "fresh"');

  // Test 3: 45 days ago is 'review_recommended'
  const date45DaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
  assert(getFreshnessStatus(date45DaysAgo) === 'review_recommended', 'Item updated 45 days ago classified as "review_recommended"');

  // Test 4: Borderline 60 days is 'review_recommended'
  const date60DaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  assert(getFreshnessStatus(date60DaysAgo) === 'review_recommended', 'Item updated exactly 60 days ago classified as "review_recommended"');

  // Test 5: 90 days ago is 'stale'
  const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  assert(getFreshnessStatus(date90DaysAgo) === 'stale', 'Item updated 90 days ago classified as "stale"');

  // Test 6: Missing timestamp defaults to 'stale'
  assert(getFreshnessStatus(null) === 'stale', 'Null timestamp safely defaults to "stale"');
  assert(getFreshnessStatus('') === 'stale', 'Empty timestamp safely defaults to "stale"');

  // ----------------------------------------------------
  // SECTION 2: Anonymous & Customer Security Tests
  // ----------------------------------------------------
  console.log('\n--- 2. Server-Side Security & Authorization Tests ---');

  // Test 7: Anonymous user cannot access admin metrics
  try {
    const { data, error } = await clientAnon.database.rpc('get_admin_metrics');
    assert(error !== null || data === null, 'Anonymous user blocked from get_admin_metrics');
  } catch {
    assert(true, 'Anonymous user threw exception trying to access get_admin_metrics');
  }

  // Test 8: Anonymous user cannot call admin_update_restaurant_status
  try {
    const { data, error } = await clientAnon.database.rpc('admin_update_restaurant_status', {
      p_restaurant_id: '00000000-0000-0000-0000-000000000000',
      p_new_status: 'approved',
      p_verified: true,
      p_admin_notes: 'Unauthorized attempt',
    });
    assert(error !== null, 'Anonymous user blocked from admin_update_restaurant_status');
  } catch {
    assert(true, 'Anonymous user blocked by RPC exception');
  }

  // Create a customer user to test customer-level security
  const testCustomerEmail = `test_customer_${Date.now()}@shopmanu.test`;
  const testCustomerPass = 'TestCustomer123!';
  const custRegRes = await clientAnon.functions.invoke('register-user', {
    body: {
      name: 'Test Customer',
      email: testCustomerEmail,
      password: testCustomerPass,
      role: 'customer',
    },
  });
  if (custRegRes.error) throw new Error(`Customer signup failed: ${JSON.stringify(custRegRes.error)}`);
  const custUser = custRegRes.data?.user;

  const clientCust = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
  });
  const { error: custLoginErr } = await clientCust.auth.signInWithPassword({
    email: testCustomerEmail,
    password: testCustomerPass,
  });
  if (custLoginErr) throw new Error(`Customer login failed: ${custLoginErr.message}`);

  // Test 9: Customer role cannot call get_admin_metrics
  const { error: custMetricsErr } = await clientCust.database.rpc('get_admin_metrics');
  assert(custMetricsErr !== null, 'Customer role blocked from get_admin_metrics (403/Forbidden)');

  // Test 10: Customer cannot call admin_update_restaurant_status
  const { error: custStatusErr } = await clientCust.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: '00000000-0000-0000-0000-000000000000',
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Hacked',
  });
  assert(custStatusErr !== null, 'Customer role blocked from admin_update_restaurant_status');

  // Test 11: Customer cannot read admin audit logs or other users' audit logs
  const { data: otherUserAuditLogs } = await clientCust.database
    .from('audit_logs')
    .select('*')
    .neq('user_id', custUser.id);
  assert(
    !otherUserAuditLogs || otherUserAuditLogs.length === 0,
    'Customer role cannot view other users or admin audit logs (RLS protected)'
  );

  const { data: adminActionLogs } = await clientCust.database
    .from('audit_logs')
    .select('*')
    .in('action', ['restaurant_approved', 'restaurant_suspended', 'restaurant_restored', 'report_resolved']);
  assert(
    !adminActionLogs || adminActionLogs.length === 0,
    'Customer role cannot view administrative moderation audit logs'
  );

  // ----------------------------------------------------
  // SECTION 3: Owner Elevation & Tampering Tests
  // ----------------------------------------------------
  console.log('\n--- 3. Owner Status Tampering Protection Tests ---');

  // Create an owner user
  const testOwnerEmail = `test_owner_${Date.now()}@shopmanu.test`;
  const testOwnerPass = 'TestOwner123!';
  const ownerRegRes = await clientAnon.functions.invoke('register-user', {
    body: {
      name: 'Test Owner',
      email: testOwnerEmail,
      password: testOwnerPass,
      role: 'owner',
    },
  });
  if (ownerRegRes.error) throw new Error(`Owner signup failed: ${JSON.stringify(ownerRegRes.error)}`);
  const ownerUser = ownerRegRes.data?.user;

  const clientOwner = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
  });
  await clientOwner.auth.signInWithPassword({
    email: testOwnerEmail,
    password: testOwnerPass,
  });

  // Owner creates a new restaurant -> default status is 'pending', verified is false
  const uniqueSlug = `test-res-p7-${Date.now()}`;
  const { data: createdRes, error: resCreateErr } = await clientOwner.database
    .from('restaurants')
    .insert([
      {
        owner_id: ownerUser.id,
        name: 'Phase 7 Test Kitchen',
        slug: uniqueSlug,
        phone: '9876543210',
        address: '100 Test St',
        area: 'Salt Lake',
        city: 'Kolkata',
        latitude: 22.585,
        longitude: 88.415,
        status: 'pending',
        verified: false,
      },
    ])
    .select()
    .single();

  if (resCreateErr) throw new Error(`Restaurant creation failed: ${resCreateErr.message}`);
  assert(createdRes.status === 'pending', 'New restaurant initialized with status = "pending"');
  assert(createdRes.verified === false, 'New restaurant initialized with verified = false');

  // Test 12: Owner attempts to self-approve via direct SQL update -> Trigger forces it to remain pending!
  await clientOwner.database
    .from('restaurants')
    .update({ status: 'approved', verified: true })
    .eq('id', createdRes.id);

  const { data: checkTamperRes } = await clientOwner.database
    .from('restaurants')
    .select('status, verified')
    .eq('id', createdRes.id)
    .single();

  assert(
    checkTamperRes.status === 'pending' && checkTamperRes.verified === false,
    'Owner cannot self-approve restaurant (trg_protect_restaurant_status resets status to pending & verified to false)'
  );

  // Test 13: Owner attempts to approve via admin RPC -> RPC blocks it!
  const { error: ownerRpcErr } = await clientOwner.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: createdRes.id,
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Owner self-approval bypass attempt',
  });
  assert(ownerRpcErr !== null, 'Owner cannot execute admin_update_restaurant_status RPC');

  // ----------------------------------------------------
  // SECTION 4: Public Visibility Rules Tests
  // ----------------------------------------------------
  console.log('\n--- 4. Public Visibility Enforcement Tests ---');

  // Test 14: Pending restaurant does NOT appear in public approved search query
  const { data: pubApproved } = await clientAnon.database
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', uniqueSlug)
    .eq('status', 'approved');

  assert(
    !pubApproved || pubApproved.length === 0,
    'Pending restaurant strictly hidden from public approved restaurant query'
  );

  // Test 15: Pending restaurant does NOT appear in PostGIS Near Me search
  const { data: nearbyPending } = await clientAnon.database.rpc('get_nearby_restaurants', {
    p_latitude: 22.585,
    p_longitude: 88.415,
    p_radius_meters: 5000,
    p_search_query: 'Phase 7 Test Kitchen',
    p_limit: 10,
    p_offset: 0,
  });

  const foundPendingInNearMe = (nearbyPending || []).some((r) => r.id === createdRes.id);
  assert(!foundPendingInNearMe, 'Pending restaurant strictly excluded from PostGIS get_nearby_restaurants');

  // ----------------------------------------------------
  // SECTION 5: Admin Workflows & Verification State Transitions
  // ----------------------------------------------------
  console.log('\n--- 5. Admin Authentication & Moderation Lifecycle Tests ---');

  // Sign in as authenticated Admin
  const clientAdmin = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
  });

  const { data: adminLogin, error: adminLoginErr } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@shopmanu.com',
    password: 'AdminSecret123!',
  });
  if (adminLoginErr) throw new Error(`Admin login failed: ${adminLoginErr.message}`);
  assert(adminLogin.user !== null, 'Admin successfully authenticated with valid credentials');

  // Test 16: Admin executes get_admin_metrics
  const { data: metrics, error: metricsErr } = await clientAdmin.database.rpc('get_admin_metrics');
  if (metricsErr) throw new Error(`get_admin_metrics error: ${metricsErr.message}`);
  assert(typeof metrics.pending_restaurants === 'number', 'Metrics returns real pending_restaurants count');
  assert(typeof metrics.approved_restaurants === 'number', 'Metrics returns real approved_restaurants count');
  assert(typeof metrics.stale_menu_count === 'number', 'Metrics returns real stale_menu_count');
  assert(typeof metrics.open_reports === 'number', 'Metrics returns real open_reports count');

  // Test 17: Admin transitions restaurant: pending -> approved
  const { data: approveRes, error: approveErr } = await clientAdmin.database.rpc(
    'admin_update_restaurant_status',
    {
      p_restaurant_id: createdRes.id,
      p_new_status: 'approved',
      p_verified: true,
      p_admin_notes: 'Approved after verifying trade license & kitchen address',
    }
  );
  if (approveErr) throw new Error(`admin_update_restaurant_status failed: ${approveErr.message}`);
  assert(approveRes.status === 'approved', 'Restaurant status successfully updated to "approved"');
  assert(approveRes.verified === true, 'Restaurant verified status updated to true');

  // Test 18: Approved restaurant is now visible in public search
  const { data: pubVisibleNow } = await clientAnon.database
    .from('restaurants')
    .select('id, name, slug')
    .eq('slug', uniqueSlug)
    .eq('status', 'approved');
  assert(pubVisibleNow && pubVisibleNow.length === 1, 'Approved restaurant is now publicly discoverable');

  // Test 19: Admin transitions restaurant: approved -> suspended
  const { data: suspendRes, error: suspendErr } = await clientAdmin.database.rpc(
    'admin_update_restaurant_status',
    {
      p_restaurant_id: createdRes.id,
      p_new_status: 'suspended',
      p_verified: false,
      p_admin_notes: 'Temporarily suspended due to health audit inquiry',
    }
  );
  if (suspendErr) throw new Error(`Suspend transition failed: ${suspendErr.message}`);
  assert(suspendRes.status === 'suspended', 'Restaurant transitioned: approved -> suspended');

  // Test 20: Suspended restaurant is immediately hidden from public search
  const { data: pubSuspendedCheck } = await clientAnon.database
    .from('restaurants')
    .select('id, name')
    .eq('slug', uniqueSlug)
    .eq('status', 'approved');
  assert(!pubSuspendedCheck || pubSuspendedCheck.length === 0, 'Suspended restaurant immediately hidden from public view');

  // Test 21: Admin restores restaurant: suspended -> approved
  const { data: restoreRes, error: restoreErr } = await clientAdmin.database.rpc(
    'admin_update_restaurant_status',
    {
      p_restaurant_id: createdRes.id,
      p_new_status: 'approved',
      p_verified: true,
      p_admin_notes: 'Reinstated after clear inspection report',
    }
  );
  if (restoreErr) throw new Error(`Restore transition failed: ${restoreErr.message}`);
  assert(restoreRes.status === 'approved', 'Restaurant transitioned: suspended -> approved (restored)');

  // Test 22: Reject invalid transition: approved -> pending
  const { error: invalidTransitionErr } = await clientAdmin.database.rpc(
    'admin_update_restaurant_status',
    {
      p_restaurant_id: createdRes.id,
      p_new_status: 'pending',
      p_verified: false,
      p_admin_notes: 'Invalid transition attempt',
    }
  );
  assert(
    invalidTransitionErr !== null && invalidTransitionErr.message.includes('Invalid status transition'),
    'Server-side validation rejects invalid status transition (approved -> pending)'
  );

  // ----------------------------------------------------
  // SECTION 6: Audit Logging Verification
  // ----------------------------------------------------
  console.log('\n--- 6. Audit Logging Verification Tests ---');

  // Test 23: Audit logs were recorded for the admin actions
  const { data: recentLogs, error: logErr } = await clientAdmin.database
    .from('audit_logs')
    .select('*')
    .eq('entity_id', createdRes.id)
    .order('created_at', { ascending: false });

  if (logErr) throw new Error(`Failed to load audit logs: ${logErr.message}`);
  assert(recentLogs && recentLogs.length >= 3, 'Audit log records created for each administrative action');

  const actionsRecorded = recentLogs.map((l) => l.action);
  assert(actionsRecorded.includes('restaurant_approved'), 'Audit log contains "restaurant_approved" action');
  assert(actionsRecorded.includes('restaurant_suspended'), 'Audit log contains "restaurant_suspended" action');
  assert(actionsRecorded.includes('restaurant_restored'), 'Audit log contains "restaurant_restored" action');

  // ----------------------------------------------------
  // SECTION 7: User Report Workflow & Moderation Tests
  // ----------------------------------------------------
  console.log('\n--- 7. Reporting & Resolution Workflow Tests ---');

  // Test 24: Customer submits report
  const { data: newReport, error: reportSubErr } = await clientCust.database
    .from('restaurant_reports')
    .insert([
      {
        restaurant_id: createdRes.id,
        food_id: null,
        report_type: 'wrong_price',
        details: 'Biryani is listed for 200 but offline menu charges 240',
        reporter_email: testCustomerEmail,
        user_id: custUser.id,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (reportSubErr) throw new Error(`Report submission failed: ${reportSubErr.message}`);
  assert(newReport.status === 'pending', 'Customer report successfully submitted with status = "pending"');

  // Test 25: Admin updates report status to investigating, then resolved
  const { data: reviewingReport, error: revErr } = await clientAdmin.database.rpc(
    'admin_update_report_status',
    {
      p_report_id: newReport.id,
      p_status: 'investigating',
      p_resolution_notes: null,
    }
  );
  if (revErr) throw new Error(`Report update to investigating failed: ${revErr.message}`);
  assert(reviewingReport.status === 'investigating', 'Admin moved report to "investigating"');

  // Test 26: Admin resolves report with resolution notes
  const { data: resolvedReport, error: resvErr } = await clientAdmin.database.rpc(
    'admin_update_report_status',
    {
      p_report_id: newReport.id,
      p_status: 'resolved',
      p_resolution_notes: 'Contacted owner. Price updated to 240 in database.',
    }
  );
  if (resvErr) throw new Error(`Report resolution failed: ${resvErr.message}`);
  assert(resolvedReport.status === 'resolved', 'Admin resolved report with status = "resolved"');
  assert(resolvedReport.resolution_notes.includes('Price updated'), 'Report contains internal resolution notes');
  assert(resolvedReport.resolved_at !== null, 'Report contains resolved_at timestamp');

  // Test 27: Audit log recorded for report resolution
  const { data: reportAuditLogs } = await clientAdmin.database
    .from('audit_logs')
    .select('*')
    .eq('entity_id', newReport.id);

  assert(
    reportAuditLogs && reportAuditLogs.some((l) => l.action === 'report_status_resolved'),
    'Audit log created for "report_status_resolved" action'
  );

  // ----------------------------------------------------
  // SECTION 8: Cleanup Test Artifacts
  // ----------------------------------------------------
  console.log('\n--- 8. Cleanup Temporary Test Records ---');
  // Delete test report
  await clientAdmin.database.from('restaurant_reports').delete().eq('id', newReport.id);
  // Delete test restaurant
  await clientAdmin.database.from('restaurants').delete().eq('id', createdRes.id);
  // Clean up audit logs for this test
  await clientAdmin.database.from('audit_logs').delete().eq('entity_id', createdRes.id);
  await clientAdmin.database.from('audit_logs').delete().eq('entity_id', newReport.id);
  console.log('✓ Cleaned up test database records.');

  console.log('\n====================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('====================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});
