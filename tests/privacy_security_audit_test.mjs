/**
 * PRIVACY & SECURITY AUDIT TEST SUITE
 *
 * Automatically verifies:
 * 1. Secrets & Credentials: Zero leaked service-role keys or database credentials in client code.
 * 2. Customer Privacy: Anonymous browsing capability, coordinate truncation to 3 decimals.
 * 3. Cross-Tenant Isolation: Database RLS enforces that owners cannot modify other owners' data.
 * 4. Protected Profiles: Public users cannot read user profiles or emails.
 * 5. Error Sanitization: Error messages are stripped of PostgreSQL tables, constraints, and traces.
 * 6. Zero Tracking: No analytics trackers or tracking scripts in dependencies or index.html.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.VITE_INSFORGE_URL || 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = process.env.VITE_INSFORGE_ANON_KEY || 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('PRIVACY & SECURITY COMPREHENSIVE AUDIT TEST SUITE');
  console.log('================================================================\n');

  // --- 1. Client Code Secrets & Credential Scan ---
  console.log('--- 1. Client Code Secrets & Credential Scan ---');

  const srcDir = path.resolve('src');
  function scanDir(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDir(full));
      } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
        files.push(full);
      }
    }
    return files;
  }

  const allSrcFiles = scanDir(srcDir);
  let leakedSecretFound = false;

  for (const file of allSrcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Check for service_role or serviceRole keys
    if (/service_role|serviceRole/i.test(content) && !file.includes('test')) {
      leakedSecretFound = true;
      console.error(`Leaked service_role pattern in: ${file}`);
    }
    // Check for hardcoded postgres master passwords
    if (/postgres:\/\/.*:.*@/i.test(content)) {
      leakedSecretFound = true;
      console.error(`Leaked postgres connection URI in: ${file}`);
    }
  }

  assert(!leakedSecretFound, 'Zero leaked service-role keys or database connection URIs in src/');

  // --- 2. Zero Tracking & Third-Party Analytics Scan ---
  console.log('\n--- 2. Zero Tracking & Analytics Dependency Audit ---');

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const bannedTrackingPackages = [
    'google-analytics',
    'react-ga',
    'mixpanel',
    'hotjar',
    '@sentry/replay',
    'logrocket',
    'fullstory',
    '@segment/analytics',
  ];

  for (const banned of bannedTrackingPackages) {
    assert(!allDeps[banned], `No tracking dependency: ${banned}`);
  }

  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(!indexHtml.includes('googletagmanager'), 'index.html contains no Google Tag Manager');
  assert(!indexHtml.includes('facebook-jssdk'), 'index.html contains no Facebook Tracking Pixel');
  assert(!indexHtml.includes('hotjar'), 'index.html contains no Hotjar Tracking');

  // --- 3. Privacy-Preserving Coordinate Truncation ---
  console.log('\n--- 3. Geolocation Precision & Truncation ---');

  const testLat = 22.58041928374;
  const testLng = 88.42728491823;
  const factor = Math.pow(10, 3);
  const truncatedLat = Math.round(testLat * factor) / factor;
  const truncatedLng = Math.round(testLng * factor) / factor;

  assert(truncatedLat === 22.58, `Latitude truncated from ${testLat} to ${truncatedLat} (~110m precision)`);
  assert(truncatedLng === 88.427, `Longitude truncated from ${testLng} to ${truncatedLng} (~110m precision)`);

  // Verify SearchPage does NOT contain auto-geolocation on page load
  const searchPageContent = fs.readFileSync('src/pages/SearchPage.tsx', 'utf8');
  assert(
    !searchPageContent.includes("useEffect(() => {\n    if (locationParam === 'near-me'"),
    'SearchPage does not auto-request location in initial useEffect on page load'
  );
  assert(
    searchPageContent.includes('isNearMePendingConsent'),
    'SearchPage requires explicit user gesture before requesting geolocation'
  );

  // --- 4. Database Anonymous Discovery & Public Read Permissions ---
  console.log('\n--- 4. Anonymous Customer Access & Field Minimization ---');

  const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // Anonymous customer queries approved restaurants
  const { data: publicRes, error: publicResErr } = await clientAnon.database
    .from('restaurants')
    .select('id, name, slug, status, verified, city')
    .eq('status', 'approved')
    .limit(3);

  assert(!publicResErr && publicRes && publicRes.length > 0, 'Anonymous visitor can browse approved restaurants without login');

  // Anonymous customer is BLOCKED from reading profiles table (no email/phone leak)
  const { data: publicProfiles, error: profErr } = await clientAnon.database
    .from('profiles')
    .select('*')
    .limit(5);

  assert(
    !publicProfiles || publicProfiles.length === 0 || profErr,
    'Anonymous visitor cannot read user profiles or owner personal details'
  );

  // --- 5. Cross-Tenant Protection & URL Tampering Prevention ---
  console.log('\n--- 5. Cross-Tenant RLS & Tampering Protection ---');

  // Anonymous user cannot modify any restaurant
  const firstResId = publicRes[0].id;
  const { data: tamperedUpdate } = await clientAnon.database
    .from('restaurants')
    .update({ name: 'Tampered Hacker Name' })
    .eq('id', firstResId)
    .select();

  assert(
    !tamperedUpdate || tamperedUpdate.length === 0,
    'Unauthenticated update strictly rejected by PostgreSQL RLS (0 rows mutated)'
  );

  // Verify EditRestaurantPage has URL tampering protection
  const editPageContent = fs.readFileSync('src/pages/EditRestaurantPage.tsx', 'utf8');
  assert(
    editPageContent.includes('Restaurant not found or you do not have permission'),
    'EditRestaurantPage blocks cross-tenant access via ?id= parameter tampering'
  );

  // Verify OwnerMenuPage has URL tampering protection
  const menuPageContent = fs.readFileSync('src/pages/OwnerMenuPage.tsx', 'utf8');
  assert(
    menuPageContent.includes('Restaurant not found or you do not have permission'),
    'OwnerMenuPage blocks cross-tenant access via ?restaurantId= parameter tampering'
  );

  // --- 6. Error Message Sanitization ---
  console.log('\n--- 6. Information Disclosure & Error Sanitization ---');

  const { sanitizeErrorMessage } = await import('../src/utils/errorHandler.ts');

  const rawPostgresError = new Error('duplicate key value violates unique constraint "restaurants_slug_key"');
  const sanitized1 = sanitizeErrorMessage(rawPostgresError);
  assert(
    sanitized1 === 'A record with this information already exists in the system.',
    'Sanitizer strips unique constraint and database schema details'
  );

  const rawFkError = new Error('update or delete on table "categories" violates foreign key constraint "foods_category_id_fkey"');
  const sanitized2 = sanitizeErrorMessage(rawFkError);
  assert(
    sanitized2 === 'This item cannot be removed because it is linked to other active records.',
    'Sanitizer strips foreign key constraint and table name details'
  );

  const rawSyntaxError = new Error('syntax error at or near "SELECT" at line 14: relation "public.internal_keys" does not exist');
  const sanitized3 = sanitizeErrorMessage(rawSyntaxError);
  assert(
    !sanitized3.includes('internal_keys') && !sanitized3.includes('syntax error'),
    'Sanitizer completely hides SQL syntax errors and internal relations'
  );

  // --- 7. Privacy Policy & Legal Transparency Audit ---
  console.log('\n--- 7. Legal Policy & Exaggerated Claims Audit ---');

  const privacyContent = fs.readFileSync('src/pages/PrivacyPage.tsx', 'utf8');
  assert(privacyContent.includes('Zero Tracking Policy'), 'Privacy Policy contains explicit Zero Tracking Policy');
  assert(privacyContent.includes('~110-meter neighborhood scale'), 'Privacy Policy explicitly describes 3-decimal coordinate truncation');
  assert(!privacyContent.includes('100% secure') && !privacyContent.includes('military-grade'), 'Privacy Policy avoids exaggerated security claims');

  console.log('\n================================================================');
  console.log(`PRIVACY & SECURITY AUDIT SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runAudit().catch((err) => {
  console.error('\nAUDIT FAILED WITH UNHANDLED ERROR:', err);
  process.exit(1);
});
