module.exports = async function(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const { name, email, password, phone, role } = body || {};

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Full name must be between 2 and 100 characters" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: "A valid business email address is required" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (phone && (typeof phone !== "string" || phone.trim().length < 7 || phone.trim().length > 25)) {
      return new Response(JSON.stringify({ error: "Phone number must be between 7 and 25 characters" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Role MUST only be 'owner'. Customers do not register, and admins cannot be created publicly.
    if (role && role !== "owner") {
      if (role === "admin") {
        return new Response(JSON.stringify({ error: "Admin accounts cannot be registered publicly." }), {
          status: 403,
          headers: corsHeaders
        });
      }
      return new Response(JSON.stringify({ error: "Registration is exclusively for shop owners. Customers do not require an account." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const assignedRole = "owner";
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : null;

    const baseUrl = Deno.env.get("INSFORGE_BASE_URL") || "https://yke9qwgm.us-east.insforge.app";
    const apiKey = Deno.env.get("API_KEY");

    // 2. Call Auth API to create user account
    const signupRes = await fetch(baseUrl + "/api/auth/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        name: cleanName
      })
    });

    const signupData = await signupRes.json();
    if (!signupRes.ok) {
      return new Response(JSON.stringify({
        error: signupData.message || signupData.error || "Failed to create shop owner account"
      }), {
        status: signupRes.status,
        headers: corsHeaders
      });
    }

    // 3. Auto-verify user email and get user id via rawsql
    const verifySqlRes = await fetch(baseUrl + "/api/database/advance/rawsql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        query: "UPDATE auth.users SET email_verified = true WHERE email = $1 RETURNING id;",
        params: [cleanEmail]
      })
    });

    const verifyData = await verifySqlRes.json();
    const userId = verifyData?.rows?.[0]?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Could not retrieve created shop owner ID" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // 4. Create record in public.profiles with the validated 'owner' role
    const profileSqlRes = await fetch(baseUrl + "/api/database/advance/rawsql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        query: "INSERT INTO public.profiles (id, name, email, phone, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, phone = $4, role = $5 RETURNING *;",
        params: [userId, cleanName, cleanEmail, cleanPhone, assignedRole]
      })
    });

    const profileData = await profileSqlRes.json();
    const profile = profileData?.rows?.[0];

    // 5. Create audit log entry
    await fetch(baseUrl + "/api/database/advance/rawsql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        query: "INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, new_data) VALUES ($1, 'profile', $2, 'create', $3);",
        params: [userId, userId, JSON.stringify({ email: cleanEmail, name: cleanName, role: assignedRole })]
      })
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: assignedRole
      },
      profile
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: corsHeaders
    });
  }
};
