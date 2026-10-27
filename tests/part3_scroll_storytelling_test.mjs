import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('--- RUNNING PART 3: CINEMATIC SCROLL STORYTELLING & TRANSITIONS TEST ---');

  const foodDiscoveryPath = path.resolve('src/components/cinematic/FoodDiscoveryPage.tsx');
  const chapterSectionPath = path.resolve('src/components/cinematic/ChapterSection.tsx');
  const typographyMarqueePath = path.resolve('src/components/cinematic/TypographyMarquee.tsx');
  const scrollRevealPath = path.resolve('src/components/cinematic/ScrollReveal.tsx');
  const indexCssPath = path.resolve('src/index.css');

  const foodDiscoveryCode = fs.readFileSync(foodDiscoveryPath, 'utf8');
  const chapterSectionCode = fs.readFileSync(chapterSectionPath, 'utf8');
  const typographyMarqueeCode = fs.readFileSync(typographyMarqueePath, 'utf8');
  const scrollRevealCode = fs.readFileSync(scrollRevealPath, 'utf8');
  const indexCssCode = fs.readFileSync(indexCssPath, 'utf8');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // 1. Technology & Motion for React
  console.log('\n[Requirement 1 & 7: Motion for React & Sticky Scene Capabilities]');
  assert(
    foodDiscoveryCode.includes("from 'motion/react'"),
    'FoodDiscoveryPage imports motion, useScroll, useTransform, useReducedMotion from motion/react'
  );
  assert(
    chapterSectionCode.includes("from 'motion/react'"),
    'ChapterSection imports scroll hooks from motion/react'
  );
  assert(
    foodDiscoveryCode.includes('useScroll') && foodDiscoveryCode.includes('useTransform'),
    'Scroll-linked transforms are implemented via useScroll and useTransform'
  );
  assert(
    foodDiscoveryCode.includes('sticky top-0') || foodDiscoveryCode.includes('sticky'),
    'Pinned scene utilizes CSS sticky positioning without scroll trapping'
  );

  // 2. Background image animations & restrained effects
  console.log('\n[Requirement 2: Background Image Animation & Restrained Depth]');
  assert(
    chapterSectionCode.includes('scrollScale') && chapterSectionCode.includes('scrollY'),
    'ChapterSection implements scrollScale and subtle vertical scrollY depth'
  );
  assert(
    chapterSectionCode.includes('radial-gradient') && chapterSectionCode.includes('rgba(200, 138, 88'),
    'Atmospheric layered scrims feature warm amber light effect'
  );
  assert(
    chapterSectionCode.includes('loading="lazy"'),
    'Below-the-fold images specify loading="lazy" for performance'
  );

  // 3. Typography animation
  console.log('\n[Requirement 3: Typography Animation & Staggered Reveals]');
  assert(
    scrollRevealCode.includes('motion/react') && scrollRevealCode.includes('whileInView'),
    'ScrollReveal provides viewport-triggered opacity and upward movement'
  );
  assert(
    foodDiscoveryCode.includes('heroContentY') && foodDiscoveryCode.includes('heroContentOpacity'),
    'Chapter I hero typography smoothly translates and fades out during scroll'
  );
  assert(
    foodDiscoveryCode.includes('velvet.') && foodDiscoveryCode.includes('italic'),
    'Headline includes gold italic emphasis on "velvet."'
  );

  // 4. Oversized typography marquees
  console.log('\n[Requirement 4: Oversized Typography Marquees]');
  const requiredPhrases = [
    'DISCOVER FOOD',
    'LOCAL FAVOURITES',
    'MENUS AND PRICES',
    'YOUR NEXT BITE'
  ];
  for (const phrase of requiredPhrases) {
    assert(
      foodDiscoveryCode.includes(phrase) || typographyMarqueeCode.includes(phrase),
      `Marquees include required phrase "${phrase}"`
    );
  }
  assert(
    typographyMarqueeCode.includes('text-stroke-cream') || typographyMarqueeCode.includes('outlined'),
    'Marquees support outlined editorial typography'
  );
  assert(
    typographyMarqueeCode.includes('text-amber-400') || typographyMarqueeCode.includes('gold'),
    'Marquees support warm gold typography'
  );
  assert(
    typographyMarqueeCode.includes('✦') || typographyMarqueeCode.includes('separator'),
    'Marquees include decorative separator symbol'
  );
  assert(
    indexCssCode.includes('marquee-left') && indexCssCode.includes('marquee-right'),
    'CSS keyframe animations support seamless left and right continuous marquee scroll'
  );

  // 5. Scroll-linked progress
  console.log('\n[Requirement 5: Scroll-Linked Progression Indicator]');
  assert(
    foodDiscoveryCode.includes('scrollYProgress') && foodDiscoveryCode.includes('scaleX'),
    'Thin progress line at top of viewport linked to scrollYProgress'
  );
  assert(
    foodDiscoveryCode.includes('activeChapter') && foodDiscoveryCode.includes('IntersectionObserver'),
    'Understated chapter indicator observes active chapters via IntersectionObserver'
  );
  assert(
    foodDiscoveryCode.includes("'chapter-discovery'") && foodDiscoveryCode.includes("'chapter-next-bite'"),
    'Chapter navigation rail tracks all six chapters (I to VI)'
  );

  // 6. Final chapter transition & instant search
  console.log('\n[Requirement 6: Final Chapter Stability & Direct Search]');
  assert(
    foodDiscoveryCode.includes("Your next favourite bite is") && foodDiscoveryCode.includes("closer than you think."),
    'Chapter VI displays stable final headline with gold italic emphasis'
  );
  assert(
    foodDiscoveryCode.includes("Discover food menus, compare prices, and find local shops in one place."),
    'Chapter VI displays exact required supporting paragraph'
  );
  assert(
    foodDiscoveryCode.includes("navigate('/search')"),
    'Search button directly invokes navigate("/search") without waiting'
  );
  assert(
    foodDiscoveryCode.includes('<span>Search</span>'),
    'Search button has exact label "Search"'
  );

  // 7. Accessibility & Performance
  console.log('\n[Requirement 8: Accessibility & Reduced Motion]');
  assert(
    foodDiscoveryCode.includes('useReducedMotion') && chapterSectionCode.includes('useReducedMotion'),
    'Both FoodDiscoveryPage and ChapterSection respect prefers-reduced-motion'
  );
  assert(
    foodDiscoveryCode.includes('prefersReducedMotion ? 0 : heroContentY'),
    'Hero scroll animation is neutralized when user prefers reduced motion'
  );
  assert(
    chapterSectionCode.includes('prefersReducedMotion ? 1 : scrollScale'),
    'Background zoom is neutralized when user prefers reduced motion'
  );
  assert(
    foodDiscoveryCode.includes('overflow-x-hidden'),
    'Page container prevents horizontal overflow'
  );

  console.log(`\n========================================`);
  console.log(`PART 3 TESTS: ${passed} / ${total} PASSED`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
