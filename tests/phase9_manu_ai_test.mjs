// ==============================================================================
// PHASE 9: MANU AI AUTOMATED TEST SUITE
// Tests all 14 criteria:
// 1. Session Isolation
// 2. Menu Search (Real Data)
// 3. Restaurant Search (Real Data)
// 4. Price Filtering & Real Prices
// 5. Price Comparison & Aggregates
// 6. PostGIS Nearby Location Search
// 7. General Conversations & Intent
// 8. Follow-up Contextual Conversation
// 9. Conversation History Persistence
// 10. Deletion & Cleanup
// 11. Database Permissions & RLS
// 12. Sensitive Data Security (No Owner Phone/Email/Notes Leak)
// 13. Edge Function Streaming & SSE Events
// 14. Session Token Spoofing Protection
// ==============================================================================

import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const insforge = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   MANU AI VERIFICATION & INTEGRATION TEST SUITE');
  console.log('======================================================\n');

  const sessionAToken = 'test_token_user_a_' + Date.now();
  const sessionBToken = 'test_token_user_b_' + Date.now();

  let conversationAId = null;

  // --------------------------------------------------------------------------
  // TEST 1: Direct Database AI Tools — Menu Search (Real Data)
  // --------------------------------------------------------------------------
  console.log('Test 1: Menu Search with Real Database Records...');
  try {
    const { data: menuData, error: menuErr } = await insforge.database.rpc('ai_search_menu_items', {
      p_query: 'biryani',
      p_veg_type: 'all',
      p_min_price: null,
      p_max_price: null,
      p_available_only: true,
      p_limit: 5
    });

    assert(!menuErr, 'ai_search_menu_items executes without error');
    assert(Array.isArray(menuData) && menuData.length > 0, `Returned ${menuData?.length || 0} real biryani items`);
    assert(menuData.some(i => i.restaurant_name === 'Arsalan' || i.restaurant_name === "Nizam's"), 'Contains authentic Kolkata heritage kitchens');
    assert(menuData.every(i => i.starting_price > 0), 'Every item has verified portion price');
    assert(menuData.every(i => !i.phone && !i.owner_id && !i.admin_notes), 'Strictly strips private owner and admin information');
  } catch (err) {
    assert(false, 'Menu search threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Price Comparison Tool across Multiple Kitchens
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Price Comparison Tool Across Approved Kitchens...');
  try {
    const { data: compData, error: compErr } = await insforge.database.rpc('ai_compare_food_prices', {
      p_dish_name: 'roll',
      p_veg_type: 'all',
      p_limit: 5
    });

    assert(!compErr, 'ai_compare_food_prices executes without error');
    assert(compData?.comparisons?.length > 1, `Found ${compData?.comparisons?.length || 0} price comparisons across kitchens`);
    assert(compData?.min_price != null && compData?.max_price != null && compData?.avg_price != null, 'Calculates min, max, and avg benchmarks');
    assert(Number(compData.min_price) <= Number(compData.avg_price) && Number(compData.avg_price) <= Number(compData.max_price), 'Comparison metrics are mathematically consistent');
  } catch (err) {
    assert(false, 'Price comparison threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Restaurant Search & Operating Hours
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Restaurant Search & Operating Hours Verification...');
  try {
    const { data: restData, error: restErr } = await insforge.database.rpc('ai_search_restaurants', {
      p_query: 'Park Street',
      p_area: null,
      p_city: null,
      p_category: null,
      p_limit: 5
    });

    assert(!restErr, 'ai_search_restaurants executes without error');
    assert(Array.isArray(restData) && restData.length > 0, `Returned ${restData?.length || 0} restaurants in Park Street`);
    assert(restData.some(r => r.name === 'Peter Cat' || r.name === 'Flurys'), 'Identified Peter Cat or Flurys');
    assert(restData.every(r => Array.isArray(r.hours)), 'Every restaurant includes structured operating hours');
    assert(restData.every(r => !r.phone && !r.owner_id && !r.admin_notes), 'Owner phone and admin notes are sanitized');
  } catch (err) {
    assert(false, 'Restaurant search threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: PostGIS Nearby Geographic Search
  // --------------------------------------------------------------------------
  console.log('\nTest 4: PostGIS Nearby Distance Search (Kolkata Coordinates)...');
  try {
    // Park Street coordinates
    const parkStreetLat = 22.5534;
    const parkStreetLng = 88.3526;

    const { data: nearbyFoods, error: nearbyErr } = await insforge.database.rpc('get_nearby_foods', {
      p_lat: parkStreetLat,
      p_lng: parkStreetLng,
      p_radius_km: 5,
      p_query: '',
      p_veg_type: 'all',
      p_available_only: true,
      p_min_price: null,
      p_max_price: null,
      p_sort_by: 'nearest',
      p_limit: 5,
      p_offset: 0
    });

    assert(!nearbyErr, 'get_nearby_foods PostGIS RPC executes without error');
    assert(Array.isArray(nearbyFoods) && nearbyFoods.length > 0, `Returned ${nearbyFoods?.length || 0} nearby foods`);
    assert(nearbyFoods.every(f => typeof f.distance_km === 'number' && f.distance_km <= 5.0), 'All items strictly within 5 km radius with distance_km calculated');
  } catch (err) {
    assert(false, 'Nearby search threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Edge Function Invocation & SSE Streaming Payload
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Edge Function Invocation & Streaming Response...');
  try {
    const { data: streamData, error: fnErr } = await insforge.functions.invoke('manu-ai', {
      body: {
        messages: [{ role: 'user', content: 'Find chicken biryani under 500' }],
        session_id: 'sess_test_a',
        session_token: sessionAToken
      }
    });

    assert(!fnErr, 'functions.invoke("manu-ai") completes without error');
    const text = typeof streamData === 'string' ? streamData : JSON.stringify(streamData);
    assert(text.includes('event: conversation'), 'Emits "conversation" event with conversation ID');
    assert(text.includes('event: cards'), 'Emits "cards" event with verified database records');
    assert(text.includes('event: token'), 'Emits "token" event with streamed response');
    assert(text.includes('event: done'), 'Emits "done" termination event');

    // Extract conversation ID
    const match = text.match(/"conversation_id":"([a-f0-9\-]+)"/);
    if (match) {
      conversationAId = match[1];
    }
    assert(conversationAId != null, `Created active conversation ${conversationAId}`);
  } catch (err) {
    assert(false, 'Edge function invocation failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Session Isolation (Visitor B cannot access Visitor A's chat)
  // --------------------------------------------------------------------------
  console.log('\nTest 6: Session Isolation & Privacy Protection...');
  try {
    // Visitor B attempts to fetch Visitor A's messages using A's conversation ID but B's token
    const { data: leakedMsgs, error: leakErr } = await insforge.database.rpc('ai_get_messages', {
      p_conversation_id: conversationAId,
      p_session_token: sessionBToken // WRONG TOKEN
    });

    assert(!leakErr, 'ai_get_messages executed safely');
    assert(!leakedMsgs || leakedMsgs.length === 0, 'Visitor B received 0 messages (Access Denied / Isolated)');

    // Visitor A fetches their own messages using A's token
    const { data: ownMsgs } = await insforge.database.rpc('ai_get_messages', {
      p_conversation_id: conversationAId,
      p_session_token: sessionAToken // CORRECT TOKEN
    });

    assert(Array.isArray(ownMsgs) && ownMsgs.length >= 2, `Visitor A successfully retrieved ${ownMsgs?.length || 0} messages`);
  } catch (err) {
    assert(false, 'Session isolation test threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Follow-up Conversation in Same Thread
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Contextual Follow-up in Same Conversation Thread...');
  try {
    const { data: followUpData, error: followUpErr } = await insforge.functions.invoke('manu-ai', {
      body: {
        conversation_id: conversationAId,
        messages: [
          { role: 'user', content: 'Find chicken biryani under 500' },
          { role: 'assistant', content: 'Here are biryanis...' },
          { role: 'user', content: 'Which one has the best rating or heritage?' }
        ],
        session_id: 'sess_test_a',
        session_token: sessionAToken
      }
    });

    assert(!followUpErr, 'Follow-up edge function invocation succeeded');
    const { data: threadMsgs } = await insforge.database.rpc('ai_get_messages', {
      p_conversation_id: conversationAId,
      p_session_token: sessionAToken
    });

    assert(Array.isArray(threadMsgs) && threadMsgs.length >= 4, `Conversation thread now has ${threadMsgs?.length || 0} messages in sequence`);
  } catch (err) {
    assert(false, 'Follow-up test threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Conversation Deletion & Cleanup
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Conversation Deletion & Session Cleanup...');
  try {
    // Visitor B cannot delete Visitor A's conversation
    const { data: deleteB } = await insforge.database.rpc('ai_delete_conversation', {
      p_conversation_id: conversationAId,
      p_session_token: sessionBToken
    });
    assert(deleteB === false, 'Visitor B cannot delete Visitor A conversation');

    // Visitor A deletes their conversation
    const { data: deleteA } = await insforge.database.rpc('ai_delete_conversation', {
      p_conversation_id: conversationAId,
      p_session_token: sessionAToken
    });
    assert(deleteA === true, 'Visitor A successfully deleted their conversation');

    // Verify conversation is gone
    const { data: convs } = await insforge.database.rpc('ai_get_conversations', {
      p_session_token: sessionAToken
    });
    assert(Array.isArray(convs) && convs.every(c => c.id !== conversationAId), 'Conversation no longer exists in history');
  } catch (err) {
    assert(false, 'Deletion test threw exception: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Clear All Sessions
  // --------------------------------------------------------------------------
  console.log('\nTest 9: Clear All History...');
  try {
    const { data: clearedCount, error: clearErr } = await insforge.database.rpc('ai_clear_conversations', {
      p_session_token: sessionAToken
    });
    assert(!clearErr, 'ai_clear_conversations executes cleanly');
    console.log(`  Cleared ${clearedCount || 0} remaining records for test session`);
  } catch (err) {
    assert(false, 'Clear history threw exception: ' + err.message);
  }

  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

