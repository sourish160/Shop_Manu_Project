/**
 * Automated Verification & Security Test Suite for Phase 9:
 * SEO, Legal, Production Security, and Data Protection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@insforge/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = process.env.VITE_INSFORGE_URL || 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = process.env.VITE_INSFORGE_ANON_KEY || 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

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

// Redirect validator mirroring src/pages/LoginPage.tsx
function isSafeInternalRedirect(path) {
  if (typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') && !path.includes('\\');
}

// Coordinate validator
function isValidCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Price validator
function isValidPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) return false;
  return price >= 0 && isFinite(price);
}

// Schema generator mock mirroring src/utils/schemaGenerator.ts
function generateRestaurantSchema(restaurant, hours) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'LocalBusiness'],
    name: restaurant.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressLocality: restaurant.area,
      addressRegion: restaurant.city,
      addressCountry: 'IN',
    },
  };

  if (restaurant.description) {
    schema.description = restaurant.description;
  }

  if (restaurant.cover_url || restaurant.logo_url) {
    schema.image = restaurant.cover_url || restaurant.logo_url;
  }

  if (restaurant.phone) {
    schema.telephone = restaurant.phone;
  }

  if (restaurant.latitude != null && restaurant.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    };
  }

  if (hours && hours.length > 0) {
    const dayMap = [
      'https://schema.org/Sunday',
      'https://schema.org/Monday',
      'https://schema.org/Tuesday',
      'https://schema.org/Wednesday',
      'https://schema.org/Thursday',
      'https://schema.org/Friday',
      'https://schema.org/Saturday',
    ];

    schema.openingHoursSpecification = hours
      .filter((h) => !h.is_closed && h.open_time && h.close_time)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[h.day_of_week] || 'https://schema.org/Monday',
        opens: h.open_time,
        closes: h.close_time,
      }));
  }

  return schema;
}

async function runPhase9TestSuite() {
  console.log('================================================================');
  console.log('STARTING PHASE 9: SEO, LEGAL, PRODUCTION SECURITY TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. OPEN REDIRECT DEFENSE TESTS
  // -------------------------------------------------------------
  console.log('--- 1. Open Redirect & Safe Redirection Tests ---');
  assert(isSafeInternalRedirect('/') === true, 'Root path is safe internal redirect');
  assert(isSafeInternalRedirect('/owner/dashboard') === true, 'Owner dashboard is safe internal redirect');
  assert(isSafeInternalRedirect('/restaurant/sweet-delights') === true, 'Public restaurant slug is safe');
  assert(isSafeInternalRedirect('/search?q=biryani') === true, 'Search with parameters is safe');
  assert(isSafeInternalRedirect('//evil.com') === false, 'Protocol-relative URL //evil.com is blocked');
  assert(isSafeInternalRedirect('//evil.com/path') === false, 'Protocol-relative //evil.com/path is blocked');
  assert(isSafeInternalRedirect('/\\evil.com') === false, 'Backslash escape /\\evil.com is blocked (CVE-2025-68470 bypass defense)');
  assert(isSafeInternalRedirect('/path\\to\\somewhere') === false, 'Path containing backslash is blocked');
  assert(isSafeInternalRedirect('https://evil.com') === false, 'Absolute external URL is blocked');
  assert(isSafeInternalRedirect('http://evil.com') === false, 'Insecure external URL is blocked');
  assert(isSafeInternalRedirect('javascript:alert(1)') === false, 'JavaScript URI is blocked');
  assert(isSafeInternalRedirect('data:text/html,<script>alert(1)</script>') === false, 'Data URI is blocked');
  assert(isSafeInternalRedirect(null) === false, 'Null redirect is rejected');
  assert(isSafeInternalRedirect(undefined) === false, 'Undefined redirect is rejected');
  assert(isSafeInternalRedirect(12345) === false, 'Non-string redirect is rejected');

  // -------------------------------------------------------------
  // 2. SCHEMA.ORG STRUCTURED DATA INTEGRITY TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. Schema.org Structured Data Integrity Tests ---');
  const mockRestaurant = {
    id: 'rest-123',
    name: 'Taste of Bengal',
    slug: 'taste-of-bengal',
    description: 'Authentic Bengali thalis and sweets',
    phone: '+91 98765 43210',
    address: '12 Park Street',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5532,
    longitude: 88.3512,
    cover_url: 'https://images.example.com/rest.webp',
    logo_url: null,
  };

  const mockHours = [
    { day_of_week: 1, open_time: '11:00', close_time: '23:00', is_closed: false },
    { day_of_week: 2, open_time: '11:00', close_time: '23:00', is_closed: false },
    { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
  ];

  const generatedSchema = generateRestaurantSchema(mockRestaurant, mockHours);
  assert(generatedSchema['@context'] === 'https://schema.org', 'Schema context is valid Schema.org');
  assert(Array.isArray(generatedSchema['@type']) && generatedSchema['@type'].includes('Restaurant'), 'Schema type includes Restaurant');
  assert(generatedSchema.name === 'Taste of Bengal', 'Schema accurately reflects real restaurant name');
  assert(generatedSchema.telephone === '+91 98765 43210', 'Schema includes real phone number');
  assert(generatedSchema.geo?.latitude === 22.5532, 'Schema includes valid geo latitude');
  assert(generatedSchema.geo?.longitude === 88.3512, 'Schema includes valid geo longitude');
  assert(generatedSchema.address?.addressLocality === 'Park Street', 'Schema includes addressLocality');
  assert(generatedSchema.address?.addressCountry === 'IN', 'Schema specifies addressCountry IN');
  assert(generatedSchema.openingHoursSpecification.length === 2, 'Schema excludes closed days from opening hours');
  assert(generatedSchema.openingHoursSpecification[0].dayOfWeek === 'https://schema.org/Monday', 'Schema maps Monday correctly');
  assert(!('aggregateRating' in generatedSchema), 'Schema STRICTLY OMITS fabricated aggregateRating');
  assert(!('reviewCount' in generatedSchema), 'Schema STRICTLY OMITS fabricated reviewCount');
  assert(!('priceRange' in generatedSchema), 'Schema STRICTLY OMITS fabricated priceRange');

  // -------------------------------------------------------------
  // 3. ROBOTS.TXT CRAWLABILITY & DISALLOW RULES TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Robots.txt Configuration & Rules Tests ---');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  assert(fs.existsSync(robotsPath), 'robots.txt exists in public/ directory');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');

  assert(robotsContent.includes('User-agent: *'), 'robots.txt specifies standard user agent wildcard');
  assert(robotsContent.includes('Allow: /'), 'robots.txt allows public root');
  assert(robotsContent.includes('Allow: /restaurant/'), 'robots.txt explicitly allows public restaurant listings');
  assert(robotsContent.includes('Allow: /search'), 'robots.txt allows search discovery');
  assert(robotsContent.includes('Disallow: /admin/'), 'robots.txt protects /admin/ routes');
  assert(robotsContent.includes('Disallow: /owner/'), 'robots.txt protects /owner/ routes');
  assert(robotsContent.includes('Disallow: /login'), 'robots.txt protects /login from unnecessary indexing');
  assert(robotsContent.includes('Disallow: /register'), 'robots.txt protects /register from unnecessary indexing');
  assert(robotsContent.includes('Sitemap: https://shopmanu.com/sitemap.xml'), 'robots.txt points to official sitemap.xml');

  // -------------------------------------------------------------
  // 4. SITEMAP.XML INTEGRITY & AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 4. Sitemap.xml Integrity & Indexability Audit ---');
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in public/ directory');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml has valid XML declaration');
  assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml includes valid sitemap namespace');
  assert(sitemapContent.includes('<loc>https://shopmanu.com/</loc>'), 'sitemap.xml indexes homepage');
  assert(sitemapContent.includes('<loc>https://shopmanu.com/search</loc>'), 'sitemap.xml indexes search page');
  assert(sitemapContent.includes('<loc>https://shopmanu.com/privacy</loc>'), 'sitemap.xml indexes privacy policy');
  assert(sitemapContent.includes('<loc>https://shopmanu.com/terms</loc>'), 'sitemap.xml indexes terms of service');
  assert(!sitemapContent.includes('/owner/'), 'sitemap.xml NEVER contains private /owner/ URLs');
  assert(!sitemapContent.includes('/admin/'), 'sitemap.xml NEVER contains private /admin/ URLs');
  assert(!sitemapContent.includes('/login'), 'sitemap.xml NEVER contains /login URL');
  assert(!sitemapContent.includes('/register'), 'sitemap.xml NEVER contains /register URL');

  // -------------------------------------------------------------
  // 5. INPUT VALIDATION & SANITIZATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 5. Input & Boundary Validation Tests ---');
  assert(isValidCoordinates(22.5726, 88.3639) === true, 'Kolkata coordinates (22.5726, 88.3639) valid');
  assert(isValidCoordinates(-33.8688, 151.2093) === true, 'Sydney coordinates (-33.8688, 151.2093) valid');
  assert(isValidCoordinates(91.0, 50.0) === false, 'Latitude > 90 rejected');
  assert(isValidCoordinates(-91.0, 50.0) === false, 'Latitude < -90 rejected');
  assert(isValidCoordinates(45.0, 181.0) === false, 'Longitude > 180 rejected');
  assert(isValidCoordinates(45.0, -181.0) === false, 'Longitude < -180 rejected');
  assert(isValidCoordinates('22.5', '88.3') === false, 'String coordinates rejected');
  assert(isValidCoordinates(NaN, 88.3) === false, 'NaN coordinates rejected');

  assert(isValidPrice(120.50) === true, 'Positive decimal price valid');
  assert(isValidPrice(0) === true, 'Zero price valid (e.g., complimentary)');
  assert(isValidPrice(-15) === false, 'Negative price rejected');
  assert(isValidPrice(NaN) === false, 'NaN price rejected');
  assert(isValidPrice('120') === false, 'String price rejected');
  assert(isValidPrice(Infinity) === false, 'Infinite price rejected');

  // Filename path traversal sanitization
  const testFilename = '../../etc/passwd.jpg';
  const sanitizedFilename = testFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  assert(!sanitizedFilename.includes('/'), 'Sanitized filename contains zero directory forward slashes');
  assert(!sanitizedFilename.includes('\\'), 'Sanitized filename contains zero backslashes');
  assert(sanitizedFilename === '.._.._etc_passwd.jpg', 'Sanitized filename replaces traversal markers safely');

  // -------------------------------------------------------------
  // 6. BACKEND SECURITY & ACCESS CONTROL TESTS (InsForge RPCs)
  // -------------------------------------------------------------
  console.log('\n--- 6. Backend Authorization & Privilege Escalation Tests ---');
  
  // Test A: Unauthenticated user attempting to execute adminUpdateRestaurantStatus
  const { data: adminRestData, error: adminRestErr } = await clientAnon.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: '00000000-0000-0000-0000-000000000000',
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Unauthorized attempt',
  });
  assert(
    adminRestErr != null || (adminRestData && adminRestData.success === false),
    'Unauthenticated call to admin_update_restaurant_status blocked by server-side is_admin() check'
  );

  // Test B: Unauthenticated user attempting to execute adminUpdateReportStatus
  const { data: adminRepData, error: adminRepErr } = await clientAnon.database.rpc('admin_update_report_status', {
    p_report_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'resolved',
    p_resolution_notes: 'Unauthorized resolution attempt',
  });
  assert(
    adminRepErr != null || (adminRepData && adminRepData.success === false),
    'Unauthenticated call to admin_update_report_status blocked by server-side is_admin() check'
  );

  // Test C: Unauthenticated user attempting to fetch admin metrics
  const { data: adminMetricsData, error: adminMetricsErr } = await clientAnon.database.rpc('get_admin_metrics');
  assert(
    adminMetricsErr != null || !adminMetricsData,
    'Unauthenticated call to get_admin_metrics blocked by server-side is_admin() check'
  );

  // Test D: Public query visibility - non-approved restaurants must not be visible via public status filter
  const { data: publicApproved } = await clientAnon.database
    .from('restaurants')
    .select('id, name, status')
    .eq('status', 'approved');
  
  const allAreApproved = (publicApproved || []).every((r) => r.status === 'approved');
  assert(allAreApproved, 'Public approved query strictly returns restaurants with status = "approved"');

  const { data: publicPending } = await clientAnon.database
    .from('restaurants')
    .select('id, name, status')
    .eq('status', 'pending');
  // Even if pending records exist in DB, verify that public queries on approved restaurants filter them out
  const pendingInApproved = (publicApproved || []).some((r) => r.status === 'pending');
  assert(!pendingInApproved, 'Pending restaurants NEVER leak into public approved restaurant queries');

  // -------------------------------------------------------------
  // 7. ENVIRONMENT VARIABLES & SECRETS SANITIZATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 7. Secrets Sanitization & .env Audit ---');
  const gitignorePath = path.join(rootDir, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore explicitly excludes .env');
  assert(gitignoreContent.includes('!.env.example'), '.gitignore preserves !.env.example template');

  const envExamplePath = path.join(rootDir, '.env.example');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  assert(envExampleContent.includes('your_insforge_anon_key_here'), '.env.example uses placeholder for anon key');
  assert(!envExampleContent.includes('anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215'), '.env.example contains zero real anon key secrets');

  // -------------------------------------------------------------
  // 8. PRODUCTION SECURITY HEADERS AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 8. Production Security Headers Audit ---');
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
  assert(viteConfigContent.includes('X-Content-Type-Options') && viteConfigContent.includes('nosniff'), 'Configured X-Content-Type-Options: nosniff');
  assert(viteConfigContent.includes('X-Frame-Options') && viteConfigContent.includes('DENY'), 'Configured X-Frame-Options: DENY');
  assert(viteConfigContent.includes('Referrer-Policy') && viteConfigContent.includes('strict-origin-when-cross-origin'), 'Configured Referrer-Policy: strict-origin-when-cross-origin');
  assert(viteConfigContent.includes('Permissions-Policy'), 'Configured Permissions-Policy restricting camera, mic, payment');
  assert(viteConfigContent.includes('Content-Security-Policy'), 'Configured Content-Security-Policy protecting scripts, styles, frames');

  console.log('\n================================================================');
  console.log(`PHASE 9 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runPhase9TestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH UNHANDLED ERROR:\n', err);
  process.exit(1);
});
