// ==============================================================================
// MANU AI - SERVERLESS EDGE FUNCTION
// Phase 2: Secure OpenAI Backend & Database Tools Dispatcher
// Runtime: Deno (InsForge Edge Function)
// ==============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-session-token",
  "Content-Type": "text/event-stream; charset=utf-8"
};

// System Prompt for MANU AI
const SYSTEM_INSTRUCTIONS = `You are MANU AI, the intelligent culinary concierge and food guide of ManuMania, Kolkata's premier authentic food discovery platform.

Key Guidelines:
1. Gastronomic Authority: You have deep knowledge of Kolkata's legendary culinary landscape—from Park Street continental heritage (Peter Cat, Flurys) to iconic Mughlai biryani houses (Arsalan, Nizam's), legendary Kathi rolls, North Kolkata heritage cafes (Mitra Cafe), and College Street sweets (Putiram, Paramount).
2. Grounded Truth: You NEVER invent restaurant facts, dishes, prices, or operating hours. When a user asks about foods, restaurants, prices, or availability, ALWAYS call the appropriate tool to retrieve verified ManuMania database facts.
3. Polite & Editorial: Your tone is refined, warm, appetizing, and concise. You write with the elegance of an editorial food connoisseur.
4. Comparison & Budgets: When users ask about budgets or price comparisons, call 'compare_food_prices' or 'search_menu_items' with price bounds.
5. Location & Proximity: When coordinates are available and the user asks for nearby food or restaurants, call 'find_nearby_foods' or 'find_nearby_restaurants'. If location is not provided, gently suggest they can enable location for exact distance.
6. Privacy & Safety: Never share private owner phone numbers, internal emails, or system IDs. Only share verified public restaurant details and portion prices.
7. Formatting: Format dish and restaurant names boldly, indicate exact prices in Indian Rupees (₹), and summarize clearly.`;

// Tool Definitions for OpenAI
const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_menu_items",
      description: "Search active dishes and food items across approved restaurants in Kolkata with price, veg/non-veg filter, and portion variants.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Food name, cuisine, or category keyword (e.g. 'biryani', 'mutton kathi roll', 'chelo kebab')" },
          veg_type: { type: "string", enum: ["all", "veg", "non_veg"], description: "Dietary preference filter" },
          min_price: { type: "number", description: "Minimum price in INR" },
          max_price: { type: "number", description: "Maximum price in INR" },
          available_only: { type: "boolean", description: "Whether to return only currently available items (default true)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_restaurants",
      description: "Search approved restaurants in Kolkata by name, locality (area), city, or category.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Restaurant name, style, or general query" },
          area: { type: "string", description: "Locality in Kolkata (e.g. 'Park Street', 'New Market', 'Ballygunge', 'College Street')" },
          category: { type: "string", description: "Category of restaurant (e.g. 'Mughlai', 'Cafe', 'Street Food')" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_restaurant_menu",
      description: "Fetch the complete verified menu of a specific approved restaurant organized by category with portion variants and prices.",
      parameters: {
        type: "object",
        properties: {
          restaurant_slug_or_id: { type: "string", description: "The restaurant slug (e.g. 'arsalan-park-circus') or UUID" },
          veg_type: { type: "string", enum: ["all", "veg", "non_veg"], description: "Optional veg filter" }
        },
        required: ["restaurant_slug_or_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_restaurant_details",
      description: "Get detailed information about an approved restaurant including address, verified status, operating hours, and active menu count.",
      parameters: {
        type: "object",
        properties: {
          restaurant_slug_or_id: { type: "string", description: "The restaurant slug or UUID" }
        },
        required: ["restaurant_slug_or_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_food_prices",
      description: "Compare prices for a specific dish across different approved Kolkata restaurants (e.g. compare 'chicken biryani' or 'egg roll' prices).",
      parameters: {
        type: "object",
        properties: {
          dish_name: { type: "string", description: "The name of the dish to compare across restaurants" },
          veg_type: { type: "string", enum: ["all", "veg", "non_veg"], description: "Optional veg filter" }
        },
        required: ["dish_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_nearby_foods",
      description: "Find verified food items near given geographic coordinates using PostGIS distance calculation.",
      parameters: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "User latitude coordinate" },
          longitude: { type: "number", description: "User longitude coordinate" },
          radius_km: { type: "number", description: "Radius in kilometers (default 5, max 20)" },
          query: { type: "string", description: "Optional dish query filter" },
          veg_type: { type: "string", enum: ["all", "veg", "non_veg"] },
          max_price: { type: "number", description: "Max budget filter in INR" }
        },
        required: ["latitude", "longitude"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_nearby_restaurants",
      description: "Find verified restaurants near given geographic coordinates with distance in km and operating hours.",
      parameters: {
        type: "object",
        properties: {
          latitude: { type: "number", description: "User latitude coordinate" },
          longitude: { type: "number", description: "User longitude coordinate" },
          radius_km: { type: "number", description: "Radius in kilometers (default 5)" },
          query: { type: "string", description: "Optional search keyword" }
        },
        required: ["latitude", "longitude"]
      }
    }
  }
];

// Helper to execute database SQL via InsForge internal API
async function executeRawSql(baseUrl, apiKey, query, params = []) {
  const url = baseUrl + "/api/database/advance/rawsql";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify({ query, params })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("DB Error (" + res.status + "): " + errText);
  }
  return await res.json();
}

// Database Tool Dispatcher
async function dispatchTool(name, args, baseUrl, apiKey) {
  switch (name) {
    case "search_menu_items": {
      const q = args.query || "";
      const veg = args.veg_type || "all";
      const minP = args.min_price != null ? Number(args.min_price) : null;
      const maxP = args.max_price != null ? Number(args.max_price) : null;
      const avail = args.available_only !== false;
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_search_menu_items($1, $2, $3, $4, $5, 8) as result;",
        [q, veg, minP, maxP, avail]
      );
      return res?.rows?.[0]?.result || [];
    }
    case "search_restaurants": {
      const q = args.query || "";
      const area = args.area || null;
      const cat = args.category || null;
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_search_restaurants($1, $2, NULL, $3, 8) as result;",
        [q, area, cat]
      );
      return res?.rows?.[0]?.result || [];
    }
    case "get_restaurant_menu": {
      const iden = args.restaurant_slug_or_id || "";
      const veg = args.veg_type || "all";
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_get_restaurant_menu($1, $2) as result;",
        [iden, veg]
      );
      return res?.rows?.[0]?.result || {};
    }
    case "get_restaurant_details": {
      const iden = args.restaurant_slug_or_id || "";
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_get_restaurant_details($1) as result;",
        [iden]
      );
      return res?.rows?.[0]?.result || {};
    }
    case "compare_food_prices": {
      const dish = args.dish_name || "";
      const veg = args.veg_type || "all";
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_compare_food_prices($1, $2, 10) as result;",
        [dish, veg]
      );
      return res?.rows?.[0]?.result || {};
    }
    case "find_nearby_foods": {
      const lat = Number(args.latitude);
      const lng = Number(args.longitude);
      const radius = Number(args.radius_km || 5);
      const q = args.query || "";
      const veg = args.veg_type || "all";
      const maxP = args.max_price != null ? Number(args.max_price) : null;
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT * FROM public.get_nearby_foods($1, $2, $3, $4, $5, true, NULL, $6, 'nearest', 8, 0);",
        [lat, lng, radius, q, veg, maxP]
      );
      return res?.rows || [];
    }
    case "find_nearby_restaurants": {
      const lat = Number(args.latitude);
      const lng = Number(args.longitude);
      const radius = Number(args.radius_km || 5);
      const q = args.query || "";
      const res = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT * FROM public.get_nearby_restaurants($1, $2, $3, $4, 'nearest', 8, 0);",
        [lat, lng, radius, q]
      );
      return res?.rows || [];
    }
    default:
      return { error: "Unknown tool: " + name };
  }
}

// Simple in-memory rate limiter per session_token (max 30 requests per minute)
const rateLimitMap = new Map();
function checkRateLimit(token) {
  const now = Date.now();
  const windowMs = 60000;
  const maxReqs = 30;
  const record = rateLimitMap.get(token) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    rateLimitMap.set(token, record);
    return true;
  }
  if (record.count >= maxReqs) {
    return false;
  }
  record.count++;
  rateLimitMap.set(token, record);
  return true;
}

// Fallback Autonomous Intent Engine (Active when OpenAI API key is not configured)
async function runAutonomousEngine(userMessage, userLocation, baseUrl, apiKey) {
  const lower = userMessage.toLowerCase();
  let text = "";
  let cards = null;
  const toolCallsMade = [];

  // 1. Price comparison intent
  if (lower.includes("compare") || lower.includes("cheapest") || lower.includes("price") && (lower.includes("vs") || lower.includes("between") || lower.includes("all"))) {
    const match = lower.match(/(?:compare|cheapest|price of)\s+([a-z\s]+?)(?:\s+price|\s+under|\s+in|$)/i);
    const dish = match ? match[1].trim() : (lower.includes("biryani") ? "biryani" : lower.includes("roll") ? "roll" : "kebab");
    toolCallsMade.push({ tool: "compare_food_prices", args: { dish_name: dish } });
    const comp = await dispatchTool("compare_food_prices", { dish_name: dish }, baseUrl, apiKey);
    if (comp.comparisons && comp.comparisons.length > 0) {
      cards = { type: "comparison", items: comp.comparisons };
      text = `Here is the portion price comparison for **${dish.toUpperCase()}** across approved Kolkata kitchens:\n\n` +
        `• **Lowest Rate:** ₹${comp.min_price}\n` +
        `• **Average Rate:** ₹${comp.avg_price}\n` +
        `• **Premium Rate:** ₹${comp.max_price}\n\n` +
        comp.comparisons.slice(0, 4).map(c => `• **${c.restaurant_name}** (${c.area}): ${c.food_name} (${c.variant_name}) — **₹${c.price}**`).join("\n") +
        `\n\nAll rates are verified directly from restaurant kitchen menus. Would you like to view detailed directions or full menus for any of these?`;
    } else {
      text = `I searched our database for **${dish}**, but couldn't find exact portion matches across multiple restaurants. Try searching for popular Kolkata classics like **Biryani**, **Egg Roll**, or **Chelo Kebab**!`;
    }
  }
  // 2. Nearby intent
  else if ((lower.includes("near me") || lower.includes("nearest") || lower.includes("around me") || lower.includes("nearby")) && userLocation?.latitude) {
    toolCallsMade.push({ tool: "find_nearby_foods", args: { latitude: userLocation.latitude, longitude: userLocation.longitude } });
    const foods = await dispatchTool("find_nearby_foods", { latitude: userLocation.latitude, longitude: userLocation.longitude, radius_km: 5 }, baseUrl, apiKey);
    if (foods.length > 0) {
      cards = { type: "foods", items: foods };
      text = `I located **${foods.length} culinary highlights** within your immediate territory:\n\n` +
        foods.slice(0, 4).map(f => `• **${f.name}** at *${f.restaurant?.name || 'Restaurant'}* (${f.distance_km} km away) — ${f.display_price_text || ('₹' + f.display_price)}`).join("\n") +
        `\n\nAll verified for live kitchen availability. Which one sounds appealing to you?`;
    } else {
      text = `No approved restaurants were found within 5 km of your location. You can expand your search or explore iconic heritage hubs like **Park Street** or **New Market**!`;
    }
  }
  // 3. Restaurant search intent
  else if (lower.includes("restaurant") || lower.includes("shop") || lower.includes("cafe") || lower.includes("peter cat") || lower.includes("arsalan") || lower.includes("flurys") || lower.includes("nizam") || lower.includes("mitra cafe")) {
    const query = lower.replace(/find|show|me|restaurants|restaurant|shops|in|at/g, "").trim();
    toolCallsMade.push({ tool: "search_restaurants", args: { query: query || "Kolkata" } });
    const restaurants = await dispatchTool("search_restaurants", { query: query || "" }, baseUrl, apiKey);
    if (restaurants.length > 0) {
      cards = { type: "restaurants", items: restaurants };
      text = `Here are verified culinary destinations matching your interest:\n\n` +
        restaurants.slice(0, 4).map(r => `• **${r.name}** (${r.area}) — ${r.category || 'Specialty Dining'}\n  *${r.description ? r.description.slice(0, 100) + '...' : r.address}*`).join("\n\n") +
        `\n\nWould you like me to pull up the complete menu or operating hours for any of these?`;
    } else {
      text = `I couldn't find restaurants matching that exact query. Iconic verified spots include **Arsalan** (Park Circus), **Peter Cat** (Park Street), **Nizam's** (New Market), and **Mitra Cafe** (Shobhabazar).`;
    }
  }
  // 4. Food / dish search intent (default)
  else {
    let cleanQ = lower.replace(/find|show|me|food|dishes|dish|available|best|authentic|top|places|for/gi, " ");
    
    // Extract price filter (e.g. "under 500", "below ₹300", "under rs 200")
    let maxPrice = null;
    const priceMatch = cleanQ.match(/(?:under|below|less than|within|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (priceMatch) {
      maxPrice = Number(priceMatch[1]);
      cleanQ = cleanQ.replace(priceMatch[0], " ");
    }

    // Extract veg preference
    let vegType = "all";
    if (cleanQ.includes("pure veg") || cleanQ.includes("vegetarian") || cleanQ.includes(" veg ") || cleanQ.startsWith("veg ")) {
      vegType = "veg";
      cleanQ = cleanQ.replace(/pure\s+veg|vegetarian|\bveg\b/gi, " ");
    } else if (cleanQ.includes("non veg") || cleanQ.includes("non-veg")) {
      vegType = "non_veg";
      cleanQ = cleanQ.replace(/non\s*-\s*veg|non\s+veg/gi, " ");
    }

    const q = cleanQ.trim().replace(/\s+/g, " ");
    toolCallsMade.push({ tool: "search_menu_items", args: { query: q, veg_type: vegType, max_price: maxPrice } });
    const foods = await dispatchTool("search_menu_items", { query: q, veg_type: vegType, max_price: maxPrice }, baseUrl, apiKey);
    if (foods.length > 0) {
      cards = { type: "foods", items: foods };
      const budgetNote = maxPrice ? ` under ₹${maxPrice}` : '';
      text = `Here are verified dishes matching **"${q || 'popular items'}"**${budgetNote} from approved Kolkata kitchens:\n\n` +
        foods.slice(0, 4).map(f => {
          const price = f.starting_price ? `from ₹${f.starting_price}` : (f.variants?.[0]?.price ? `₹${f.variants[0].price}` : '');
          return `• **${f.name}** (${f.veg_type === 'veg' ? '🟢 Pure Veg' : '🔴 Non-Veg'}) — ${f.restaurant_name} (${f.restaurant_area}) ${price ? '· **' + price + '**' : ''}`;
        }).join("\n") +
        `\n\nEvery dish is verified for live pricing and portion weights. Would you like to check portion variants or compare with other shops?`;
    } else {
      text = `I searched for **"${q}"**${maxPrice ? ` under ₹${maxPrice}` : ''}, but didn't find matching active dishes right now. You can try searching for iconic Kolkata classics like **Chicken Biryani**, **Mutton Chaap**, **Egg Roll**, or **Chelo Kebab**!`;
    }
  }

  return { text, cards, toolCallsMade };
}

// Main Edge Function Handler
module.exports = async function(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const {
      messages = [],
      conversation_id = null,
      session_id = null,
      session_token = null,
      user_location = null
    } = body || {};

    if (!session_token || typeof session_token !== "string") {
      return new Response(JSON.stringify({ error: "Session token is required for isolated anonymous conversations." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array cannot be empty." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Rate limiting
    if (!checkRateLimit(session_token)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before sending another message." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    if (lastUserMessage.length > 4000) {
      return new Response(JSON.stringify({ error: "Message exceeds maximum length of 4000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const baseUrl = (typeof Deno !== "undefined" ? Deno.env.get("INSFORGE_BASE_URL") : process.env.INSFORGE_BASE_URL) || "https://yke9qwgm.us-east.insforge.app";
    const apiKey = (typeof Deno !== "undefined" ? Deno.env.get("API_KEY") : process.env.API_KEY);
    const openaiApiKey = (typeof Deno !== "undefined" ? (Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENROUTER_API_KEY")) : (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY));

    // 1. Resolve or Create Conversation
    let activeConvId = conversation_id;
    if (!activeConvId) {
      const title = lastUserMessage.slice(0, 40).trim() || "New Food Chat";
      const convRes = await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_create_conversation($1, $2, $3) as id;",
        [session_id || session_token, session_token, title]
      );
      activeConvId = convRes?.rows?.[0]?.id;
    }

    // 2. Persist User Message
    if (activeConvId) {
      await executeRawSql(
        baseUrl,
        apiKey,
        "SELECT public.ai_save_message($1, $2, 'user', $3);",
        [activeConvId, session_token, lastUserMessage]
      );
    }

    // 3. Setup SSE Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Send active conversation ID
          sendEvent("conversation", { conversation_id: activeConvId });

          let finalAssistantText = "";
          let finalCards = null;
          let finalToolCalls = null;

          // Check if OpenAI API key is available
          if (openaiApiKey) {
            // Call OpenAI Responses / Chat Completions with Tools
            sendEvent("tool_start", { name: "model_init", message: "Connecting to OpenAI model..." });

            const formattedMessages = [
              { role: "system", content: SYSTEM_INSTRUCTIONS },
              ...messages.slice(-8)
            ];

            const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: formattedMessages,
                tools: AI_TOOLS,
                tool_choice: "auto",
                stream: false // Non-stream tool call check
              })
            });

            if (openAiRes.ok) {
              const aiData = await openAiRes.json();
              const choice = aiData.choices?.[0];
              const msg = choice?.message;

              // Check if model called tools
              if (msg?.tool_calls && msg.tool_calls.length > 0) {
                finalToolCalls = msg.tool_calls;
                const toolOutputs = [];

                for (const toolCall of msg.tool_calls) {
                  const fnName = toolCall.function.name;
                  let fnArgs = {};
                  try { fnArgs = JSON.parse(toolCall.function.arguments); } catch (e) {}

                  sendEvent("tool_start", { name: fnName, args: fnArgs });
                  const result = await dispatchTool(fnName, fnArgs, baseUrl, apiKey);

                  // Extract cards for rich rendering
                  if (fnName === "search_menu_items" || fnName === "find_nearby_foods") {
                    finalCards = { type: "foods", items: Array.isArray(result) ? result : [] };
                  } else if (fnName === "search_restaurants" || fnName === "find_nearby_restaurants") {
                    finalCards = { type: "restaurants", items: Array.isArray(result) ? result : [] };
                  } else if (fnName === "compare_food_prices") {
                    finalCards = { type: "comparison", items: result?.comparisons || [] };
                  }

                  toolOutputs.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: fnName,
                    content: JSON.stringify(result)
                  });
                }

                // Follow up with tool outputs
                const secondRes = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${openaiApiKey}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                      ...formattedMessages,
                      msg,
                      ...toolOutputs
                    ],
                    stream: true
                  })
                });

                if (secondRes.ok && secondRes.body) {
                  if (finalCards) sendEvent("cards", finalCards);
                  const reader = secondRes.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = "";

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("data: ")) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === "[DONE]") continue;
                        try {
                          const parsed = JSON.parse(dataStr);
                          const token = parsed.choices?.[0]?.delta?.content;
                          if (token) {
                            finalAssistantText += token;
                            sendEvent("token", token);
                          }
                        } catch (e) {}
                      }
                    }
                  }
                }
              } else {
                // Direct response without tools
                finalAssistantText = msg?.content || "How can I assist your culinary journey today?";
                sendEvent("token", finalAssistantText);
              }
            } else {
              throw new Error("OpenAI error: " + (await openAiRes.text()));
            }
          } else {
            // Autonomous Direct Engine (Zero latency, real database verified results)
            const autoResult = await runAutonomousEngine(lastUserMessage, user_location, baseUrl, apiKey);
            finalAssistantText = autoResult.text;
            finalCards = autoResult.cards;
            finalToolCalls = autoResult.toolCallsMade;

            if (finalCards) {
              sendEvent("cards", finalCards);
            }

            // Stream response tokens with slight natural cadence
            const words = finalAssistantText.split(" ");
            for (let i = 0; i < words.length; i++) {
              const piece = words[i] + (i < words.length - 1 ? " " : "");
              sendEvent("token", piece);
              if (i % 6 === 0) await new Promise(r => setTimeout(r, 12));
            }
          }

          // 4. Persist Assistant Message
          if (activeConvId && finalAssistantText) {
            await executeRawSql(
              baseUrl,
              apiKey,
              "SELECT public.ai_save_message($1, $2, 'assistant', $3, $4, $5);",
              [
                activeConvId,
                session_token,
                finalAssistantText,
                finalCards ? JSON.stringify({ cards: finalCards }) : "{}",
                finalToolCalls ? JSON.stringify(finalToolCalls) : null
              ]
            );
          }

          sendEvent("done", { success: true });
        } catch (streamErr) {
          sendEvent("error", { message: streamErr.message || "An error occurred during AI processing." });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
