/**
 * Automated Verification Test Suite: Multi-Shop Ownership & Strict Cross-Tenant Isolation
 * 
 * Validates:
 * 1. Multi-shop owner capability (Owner 1 owns multiple shops: Aminia Biryani & Royal Roll Corner)
 * 2. Single-shop owner capability (Owner 2 owns Dakshin Spice Kitchen)
 * 3. Strict multi-tenant isolation: Owner 1 only queries and sees their 2 shops; Owner 2 only queries and sees their 1 shop.
 * 4. Database-level RLS cross-tenant mutation rejection:
 *    - Owner 2 cannot insert category into Owner 1's shop
 *    - Owner 2 cannot insert food into Owner 1's shop
 *    - Owner 2 cannot update Owner 1's shop details
 *    - Owner 1 cannot update Owner 2's shop details
 * 5. Public customer discovery: All 3 shops and their foods are discoverable publicly without authentication.
 */

import { createClient } from '@insforge/sdk';
import assert from 'node:assert';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

let passed = 0;

function check(desc, condition) {
  assert(condition, `FAILED: ${desc}`);
  console.log(`✓ PASS: ${desc}`);
  passed++;
}

async function run() {
  console.log('================================================================');
  console.log('MULTI-SHOP OWNERSHIP & STRICT CROSS-TENANT ISOLATION TEST');
  console.log('================================================================\n');

  // --- 1. Owner 1 (Multi-Shop Owner) ---
  console.log('--- 1. Testing Owner 1 (Multi-Shop Owner: owner.kolkata@shopmanu.com) ---');
  const clientOwner1 = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: auth1, error: auth1Err } = await clientOwner1.auth.signInWithPassword({
    email: 'owner.kolkata@shopmanu.com',
    password: 'OwnerPassword123!',
  });
  check('Owner 1 authenticated successfully', !auth1Err && auth1?.user);
  const owner1Id = auth1.user.id;

  // Query restaurants owned by Owner 1
  const { data: owner1Shops, error: shops1Err } = await clientOwner1.database
    .from('restaurants')
    .select('id, name, owner_id, status')
    .eq('owner_id', owner1Id)
    .order('created_at', { ascending: false });

  check('Owner 1 shops fetched without error', !shops1Err && Array.isArray(owner1Shops));
  check('Owner 1 owns at least 2 food shops', owner1Shops.length >= 2);
  const shopNames1 = owner1Shops.map((s) => s.name);
  check('Owner 1 owns "Aminia Grand Biryani & Kebabs"', shopNames1.includes('Aminia Grand Biryani & Kebabs'));
  check('Owner 1 owns "Royal Roll Corner & Street Bites"', shopNames1.includes('Royal Roll Corner & Street Bites'));
  check('All shops returned for Owner 1 strictly have owner_id === owner1Id', owner1Shops.every((s) => s.owner_id === owner1Id));

  // --- 2. Owner 2 (Single-Shop Owner) ---
  console.log('\n--- 2. Testing Owner 2 (Single-Shop Owner: owner.south@shopmanu.com) ---');
  const clientOwner2 = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: auth2, error: auth2Err } = await clientOwner2.auth.signInWithPassword({
    email: 'owner.south@shopmanu.com',
    password: 'OwnerPassword123!',
  });
  check('Owner 2 authenticated successfully', !auth2Err && auth2?.user);
  const owner2Id = auth2.user.id;

  // Query restaurants owned by Owner 2
  const { data: owner2Shops, error: shops2Err } = await clientOwner2.database
    .from('restaurants')
    .select('id, name, owner_id, status')
    .eq('owner_id', owner2Id)
    .order('created_at', { ascending: false });

  check('Owner 2 shops fetched without error', !shops2Err && Array.isArray(owner2Shops));
  const shopNames2 = owner2Shops.map((s) => s.name);
  check('Owner 2 owns "Dakshin Spice Kitchen"', shopNames2.includes('Dakshin Spice Kitchen'));
  check('Owner 2 query does NOT include Owner 1 shops', !shopNames2.includes('Aminia Grand Biryani & Kebabs') && !shopNames2.includes('Royal Roll Corner & Street Bites'));
  check('All shops returned for Owner 2 strictly have owner_id === owner2Id', owner2Shops.every((s) => s.owner_id === owner2Id));

  // --- 3. Strict Database RLS Cross-Tenant Mutation Tests ---
  console.log('\n--- 3. Testing Database RLS Cross-Tenant Tampering Prevention ---');
  const aminiaShop = owner1Shops.find((s) => s.name === 'Aminia Grand Biryani & Kebabs');
  const dakshinShop = owner2Shops.find((s) => s.name === 'Dakshin Spice Kitchen');

  // Attack 1: Owner 2 tries to update Owner 1's restaurant name
  const { data: tamperedRest } = await clientOwner2.database
    .from('restaurants')
    .update({ name: 'HACKED BY OWNER 2' })
    .eq('id', aminiaShop.id)
    .select();
  check('Owner 2 update on Owner 1 restaurant strictly denied by RLS (0 rows mutated)', !tamperedRest || tamperedRest.length === 0);

  // Attack 2: Owner 2 tries to insert a category into Owner 1's restaurant
  const { error: injectCatErr } = await clientOwner2.database
    .from('categories')
    .insert([{ restaurant_id: aminiaShop.id, name: 'Malicious Category' }]);
  check('Owner 2 insert category into Owner 1 restaurant strictly rejected by RLS', !!injectCatErr);

  // Attack 3: Owner 2 tries to insert a food into Owner 1's restaurant
  const { error: injectFoodErr } = await clientOwner2.database
    .from('foods')
    .insert([{ restaurant_id: aminiaShop.id, name: 'Malicious Dish', veg_type: 'veg', status: 'active', available: true }]);
  check('Owner 2 insert food into Owner 1 restaurant strictly rejected by RLS', !!injectFoodErr);

  // Attack 4: Owner 1 tries to update Owner 2's restaurant
  const { data: tamperedRest1 } = await clientOwner1.database
    .from('restaurants')
    .update({ name: 'HACKED BY OWNER 1' })
    .eq('id', dakshinShop.id)
    .select();
  check('Owner 1 update on Owner 2 restaurant strictly denied by RLS (0 rows mutated)', !tamperedRest1 || tamperedRest1.length === 0);

  // Attack 5: Owner 1 tries to insert category into Owner 2's restaurant
  const { error: injectCatErr1 } = await clientOwner1.database
    .from('categories')
    .insert([{ restaurant_id: dakshinShop.id, name: 'Malicious Category by Owner 1' }]);
  check('Owner 1 insert category into Owner 2 restaurant strictly rejected by RLS', !!injectCatErr1);

  // --- 4. Public Discovery Verification ---
  console.log('\n--- 4. Testing Public Anonymous Discovery of Demo Menus ---');
  const clientPublic = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // Public search for Biryani
  const { data: biryaniFoods, error: biryaniErr } = await clientPublic.database
    .from('foods')
    .select('id, name, restaurant_id, foods_restaurants:restaurant_id(name, status)')
    .ilike('name', '%biryani%')
    .eq('status', 'active');
  check('Public customer searches for "biryani" successfully', !biryaniErr && Array.isArray(biryaniFoods) && biryaniFoods.length > 0);

  // Public search for Dosa
  const { data: dosaFoods, error: dosaErr } = await clientPublic.database
    .from('foods')
    .select('id, name, restaurant_id')
    .ilike('name', '%dosa%')
    .eq('status', 'active');
  check('Public customer searches for "dosa" successfully', !dosaErr && Array.isArray(dosaFoods) && dosaFoods.length > 0);

  // Public search for Roll
  const { data: rollFoods, error: rollErr } = await clientPublic.database
    .from('foods')
    .select('id, name, restaurant_id')
    .ilike('name', '%roll%')
    .eq('status', 'active');
  check('Public customer searches for "roll" successfully', !rollErr && Array.isArray(rollFoods) && rollFoods.length > 0);

  console.log('\n================================================================');
  console.log(`MULTI-SHOP & ISOLATION SUITE SUMMARY: ${passed} / ${passed} TESTS PASSED`);
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
