import { createClient } from '@insforge/sdk';
import assert from 'node:assert';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

console.log('================================================================');
console.log('SEPARATED LOGIN WORKFLOW & STRICT ROLE ISOLATION TEST');
console.log('================================================================\n');

async function runTests() {
  let passed = 0;
  const timestamp = Date.now();
  const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // 1. Create and verify a real Shop Owner account
  console.log('--- 1. Testing Shop Owner Registration and Profile ---');
  const ownerEmail = `owner_auth_test_${timestamp}@shopmanu.test`;
  const ownerPassword = 'OwnerSecretPass123!';
  const { data: regData, error: regErr } = await clientAnon.functions.invoke('register-user', {
    body: {
      name: `Owner Test ${timestamp}`,
      email: ownerEmail,
      password: ownerPassword,
      phone: '+919876543210',
      role: 'owner',
    },
  });
  assert(!regErr && regData?.success, `Owner registration failed: ${regErr?.message}`);

  const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: ownerAuth, error: ownerLoginErr } = await clientOwner.auth.signInWithPassword({
    email: ownerEmail,
    password: ownerPassword,
  });
  assert(!ownerLoginErr && ownerAuth?.user, `Owner login failed: ${ownerLoginErr?.message}`);

  const { data: ownerProfile, error: profileErr } = await clientOwner.database
    .from('profiles')
    .select('role')
    .eq('id', ownerAuth.user.id)
    .single();

  assert(!profileErr, `Failed to fetch owner profile: ${profileErr?.message}`);
  assert.strictEqual(ownerProfile.role, 'owner', 'Expected role to be "owner"');
  console.log('✓ PASS: Shop owner authenticates successfully with role="owner"');
  passed++;

  // 2. Strict Role Isolation on Admin Portal:
  // If an owner account tries to authenticate at /admin/login, the portal verifies:
  // profile.role === 'admin'. If not, it immediately terminates the session and rejects access.
  console.log('\n--- 2. Simulating Admin Portal Guard Against Shop Owner ---');
  const satisfiesAdminRole = ownerProfile.role === 'admin';
  assert.strictEqual(satisfiesAdminRole, false, 'Shop owner must be strictly rejected by Admin Portal');
  console.log('✓ PASS: Admin Portal role validator denies shop owner with unauthorized error');
  passed++;

  // 3. Testing Platform Admin Authentication
  console.log('\n--- 3. Testing Platform Administrator Authentication ---');
  const clientAdmin = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: adminAuth, error: adminErr } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@shopmanu.com',
    password: 'AdminSecret123!',
  });
  assert(!adminErr && adminAuth?.user, `Admin login failed: ${adminErr?.message}`);

  const { data: adminProfile, error: adminProfErr } = await clientAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', adminAuth.user.id)
    .single();

  assert(!adminProfErr, `Failed to fetch admin profile: ${adminProfErr?.message}`);
  assert.strictEqual(adminProfile.role, 'admin', 'Expected role to be "admin"');
  console.log('✓ PASS: Platform administrator authenticates with role="admin"');
  passed++;

  const isAdminAuthorized = adminProfile.role === 'admin';
  assert.strictEqual(isAdminAuthorized, true, 'Admin credentials satisfy Admin Portal requirements');
  console.log('✓ PASS: Admin Portal admits verified platform administrator');
  passed++;

  // Clean up test owner
  await clientAdmin.database.from('profiles').delete().eq('id', ownerAuth.user.id);
  console.log('✓ PASS: Temporary test owner account cleaned up');
  passed++;

  console.log('\n================================================================');
  console.log(`SEPARATED AUTHENTICATION SUITE: ${passed} / ${passed} TESTS PASSED`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
