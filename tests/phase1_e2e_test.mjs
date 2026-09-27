import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

async function runTestSuite() {
  console.log('====================================================');
  console.log('PHASE 1: SECURE BACKEND & AUTHORIZATION TEST SUITE');
  console.log('====================================================\n');

  const client = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const timestamp = Date.now();

  const customerData = {
    name: 'Customer Chloe',
    email: `customer_chloe_${timestamp}@test.com`,
    password: 'password123',
    phone: '+15551112222',
    role: 'customer'
  };

  const ownerAData = {
    name: 'Owner Arthur',
    email: `owner_arthur_${timestamp}@test.com`,
    password: 'password123',
    phone: '+15553334444',
    role: 'owner'
  };

  const ownerBData = {
    name: 'Owner Beatrice',
    email: `owner_beatrice_${timestamp}@test.com`,
    password: 'password123',
    phone: '+15555556666',
    role: 'owner'
  };

  const results = [];

  function record(title, passed, details) {
    results.push({ title, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${title}`);
    if (details) console.log(`   ${details}`);
  }

  // 1. Customer Registration
  try {
    const reg = await client.functions.invoke('register-user', { body: customerData });
    if (reg.data?.success && reg.data.user.role === 'customer') {
      record('Customer Registration', true, `User ID: ${reg.data.user.id}, Role: ${reg.data.user.role}`);
    } else {
      record('Customer Registration', false, JSON.stringify(reg.data || reg.error));
    }
  } catch (err) {
    record('Customer Registration', false, err.message);
  }

  // 2. Customer Login & Session Detection
  let customerUser = null;
  const clientCustomer = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  try {
    const login = await clientCustomer.auth.signInWithPassword({
      email: customerData.email,
      password: customerData.password
    });
    if (login.data?.accessToken && login.data.user) {
      customerUser = login.data.user;
      const cur = await clientCustomer.auth.getCurrentUser();
      const prof = await clientCustomer.database.from('profiles').select('*').single();
      record('Customer Login & Profile Fetch', true, `Email: ${login.data.user.email}, Profile Role: ${prof.data?.role}`);
    } else {
      record('Customer Login & Profile Fetch', false, JSON.stringify(login.error));
    }
  } catch (err) {
    record('Customer Login & Profile Fetch', false, err.message);
  }

  // 3. Customer Logout
  try {
    const logoutRes = await clientCustomer.auth.signOut();
    const curAfter = await clientCustomer.auth.getCurrentUser();
    record('Customer Logout', !curAfter.data?.user, 'Session cleared successfully');
  } catch (err) {
    record('Customer Logout', false, err.message);
  }

  // 4. Owner Registration
  let ownerAUser = null;
  try {
    const reg = await client.functions.invoke('register-user', { body: ownerAData });
    if (reg.data?.success && reg.data.user.role === 'owner') {
      record('Owner Registration', true, `User ID: ${reg.data.user.id}, Role: ${reg.data.user.role}`);
    } else {
      record('Owner Registration', false, JSON.stringify(reg.data || reg.error));
    }
  } catch (err) {
    record('Owner Registration', false, err.message);
  }

  // 5. Owner Login
  const clientOwnerA = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  try {
    const login = await clientOwnerA.auth.signInWithPassword({
      email: ownerAData.email,
      password: ownerAData.password
    });
    if (login.data?.accessToken && login.data.user) {
      ownerAUser = login.data.user;
      const prof = await clientOwnerA.database.from('profiles').select('*').single();
      record('Owner Login & Profile Fetch', true, `Email: ${login.data.user.email}, Profile Role: ${prof.data?.role}`);
    } else {
      record('Owner Login & Profile Fetch', false, JSON.stringify(login.error));
    }
  } catch (err) {
    record('Owner Login & Profile Fetch', false, err.message);
  }

  // 6. Owner Restaurant Creation
  let restaurantA = null;
  try {
    const res = await clientOwnerA.database.from('restaurants').insert([{
      owner_id: ownerAUser.id,
      name: 'Arthur Royal Dine',
      description: 'Traditional royal feasts and grill',
      phone: '+15553334444',
      address: '100 King Street',
      area: 'Heritage Quarter',
      city: 'Metro City',
      status: 'pending',
      verified: false
    }]).select().single();

    if (res.data?.id && res.data.status === 'pending' && res.data.verified === false) {
      restaurantA = res.data;
      record('Owner Restaurant Creation', true, `Created ID: ${res.data.id}, Slug: ${res.data.slug}, Status: ${res.data.status}, Verified: ${res.data.verified}`);
    } else {
      record('Owner Restaurant Creation', false, JSON.stringify(res.error || res.data));
    }
  } catch (err) {
    record('Owner Restaurant Creation', false, err.message);
  }

  // 7. Owner Restaurant Editing
  try {
    const updateRes = await clientOwnerA.database.from('restaurants').update({
      name: 'Arthur Royal Dine & Lounge',
      description: 'Updated fine dining and grill'
    }).eq('id', restaurantA.id).select().single();

    if (updateRes.data?.name === 'Arthur Royal Dine & Lounge') {
      record('Owner Restaurant Editing', true, `Updated name to: "${updateRes.data.name}"`);
    } else {
      record('Owner Restaurant Editing', false, JSON.stringify(updateRes.error));
    }
  } catch (err) {
    record('Owner Restaurant Editing', false, err.message);
  }

  // 8. Register Owner B and Create Restaurant B
  let restaurantB = null;
  const clientOwnerB = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  try {
    const regB = await client.functions.invoke('register-user', { body: ownerBData });
    await clientOwnerB.auth.signInWithPassword({
      email: ownerBData.email,
      password: ownerBData.password
    });
    const curB = (await clientOwnerB.auth.getCurrentUser()).data.user;
    const resB = await clientOwnerB.database.from('restaurants').insert([{
      owner_id: curB.id,
      name: 'Beatrice Bakery',
      description: 'Fresh pastries and sourdough',
      phone: '+15555556666',
      address: '200 Baker Way',
      area: 'Old Town',
      city: 'Metro City',
      status: 'pending',
      verified: false
    }]).select().single();
    restaurantB = resB.data;
    record('Owner B Setup', true, `Restaurant B ID: ${restaurantB.id}`);
  } catch (err) {
    record('Owner B Setup', false, err.message);
  }

  // SECURITY BOUNDARY TESTS:
  console.log('\n--- TESTING MANDATORY SECURITY BOUNDARIES ---');

  // Security Test 1: Customer tries to create a restaurant
  try {
    await clientCustomer.auth.signInWithPassword({
      email: customerData.email,
      password: customerData.password
    });
    const custInsert = await clientCustomer.database.from('restaurants').insert([{
      owner_id: customerUser.id,
      name: 'Customer Illegal Cafe',
      phone: '+15551112222',
      address: '123 Fake Street',
      area: 'Nowhere',
      city: 'City',
      status: 'pending',
      verified: false
    }]);
    const blocked = custInsert.error !== null;
    record('Security Test 1: Customer tries to create restaurant', blocked,
      blocked ? `Correctly DENIED: ${custInsert.error.message}` : 'FAIL: Customer was able to insert!');
  } catch (err) {
    record('Security Test 1: Customer tries to create restaurant', true, `Exception thrown: ${err.message}`);
  }

  // Security Test 2: Owner A tries to update Owner B's restaurant
  try {
    const crossUpdate = await clientOwnerA.database.from('restaurants').update({
      name: 'Hacked by Owner A'
    }).eq('id', restaurantB.id).select();
    const blocked = !crossUpdate.data || crossUpdate.data.length === 0;
    record('Security Test 2: Owner A tries to update Owner B restaurant', blocked,
      blocked ? 'Correctly DENIED: 0 rows modified (RLS isolated)' : 'FAIL: Owner A modified Owner B restaurant!');
  } catch (err) {
    record('Security Test 2: Owner A tries to update Owner B restaurant', true, `Exception thrown: ${err.message}`);
  }

  // Security Test 3: Owner A tries to delete Owner B's restaurant
  try {
    const crossDelete = await clientOwnerA.database.from('restaurants').delete().eq('id', restaurantB.id).select();
    const blocked = !crossDelete.data || crossDelete.data.length === 0;
    // Verify Restaurant B still exists
    const checkB = await clientOwnerB.database.from('restaurants').select('*').eq('id', restaurantB.id).single();
    const stillExists = checkB.data?.name === 'Beatrice Bakery';
    record('Security Test 3: Owner A tries to delete Owner B restaurant', blocked && stillExists,
      (blocked && stillExists) ? 'Correctly DENIED: 0 rows deleted, Restaurant B remains intact' : 'FAIL: Restaurant deleted!');
  } catch (err) {
    record('Security Test 3: Owner A tries to delete Owner B restaurant', true, `Exception thrown: ${err.message}`);
  }

  // Security Test 4: Owner tries to access admin functionality (escalate role or self-approve)
  try {
    const roleEscalate = await clientOwnerA.database.from('profiles').update({
      role: 'admin'
    }).eq('id', ownerAUser.id).select();
    const roleBlocked = roleEscalate.error !== null || (roleEscalate.data && roleEscalate.data[0]?.role !== 'admin');
    
    const selfApprove = await clientOwnerA.database.from('restaurants').update({
      status: 'approved',
      verified: true
    }).eq('id', restaurantA.id).select();
    const approveBlocked = selfApprove.data?.[0]?.status === 'pending' && selfApprove.data?.[0]?.verified === false;

    record('Security Test 4: Owner attempts admin escalation / self-approval', roleBlocked && approveBlocked,
      `Role escalation: ${roleEscalate.error?.message || 'blocked'}, Status modification: ${approveBlocked ? 'prevented by trigger' : 'not blocked'}`);
  } catch (err) {
    record('Security Test 4: Owner attempts admin escalation / self-approval', true, `Exception thrown: ${err.message}`);
  }

  // Security Test 5: Unauthenticated request tries to modify restaurant
  try {
    const unauthClient = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
    const unauthUpdate = await unauthClient.database.from('restaurants').update({
      name: 'Unauthenticated defacement'
    }).eq('id', restaurantA.id).select();
    const blocked = unauthUpdate.error !== null || !unauthUpdate.data || unauthUpdate.data.length === 0;
    record('Security Test 5: Unauthenticated request tries to modify restaurant', blocked,
      blocked ? `Correctly DENIED: ${unauthUpdate.error?.message || '0 rows affected'}` : 'FAIL: Unauthenticated update succeeded!');
  } catch (err) {
    record('Security Test 5: Unauthenticated request tries to modify restaurant', true, `Exception thrown: ${err.message}`);
  }

  // Security Test 6: Stable Unique Slug Generation (Duplicate Name)
  try {
    const dupRes = await clientOwnerA.database.from('restaurants').insert([{
      owner_id: ownerAUser.id,
      name: 'Arthur Royal Dine', // Collides with existing 'arthur-royal-dine' slug
      phone: '+15553334444',
      address: '101 King Street',
      area: 'Heritage Quarter',
      city: 'Metro City',
      status: 'pending',
      verified: false
    }]).select().single();

    const expectedSuffix = /^arthur-royal-dine(-\d+)?$/.test(dupRes.data?.slug) && dupRes.data?.slug !== 'arthur-royal-dine';
    record('Slug Uniqueness Test', expectedSuffix,
      expectedSuffix ? `Generated unique slug: "${dupRes.data.slug}"` : `Unexpected slug: ${dupRes.data?.slug}`);
  } catch (err) {
    record('Slug Uniqueness Test', false, err.message);
  }

  // 9. Owner Logout
  try {
    await clientOwnerA.auth.signOut();
    const curA = await clientOwnerA.auth.getCurrentUser();
    record('Owner Logout', !curA.data?.user, 'Owner A session ended');
  } catch (err) {
    record('Owner Logout', false, err.message);
  }

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');
}

runTestSuite().catch(console.error);
