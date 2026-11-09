-- ==============================================================================
-- MANU AI MIGRATION: CONVERSATION STORAGE & DATABASE AI TOOLS
-- Phase 3 (Database Tools) & Phase 4 (Conversation Storage)
-- ==============================================================================

-- 1. Conversation Storage Tables
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  session_token text NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  tool_calls jsonb,
  tool_call_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON public.ai_conversations(session_token);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON public.ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 2. Secure RPC Functions for Conversation Management (Session Isolation)
-- Users can only access conversations if they provide the matching session_token OR authenticated uid.

CREATE OR REPLACE FUNCTION public.ai_get_conversations(p_session_token text)
RETURNS TABLE (
  id uuid,
  title text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_session_token IS NULL OR trim(p_session_token) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.title, c.metadata, c.created_at, c.updated_at
  FROM public.ai_conversations c
  WHERE c.session_token = p_session_token
     OR (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
  ORDER BY c.updated_at DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_get_messages(p_conversation_id uuid, p_session_token text)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  tool_calls jsonb,
  tool_call_id text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify ownership first
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = p_conversation_id
      AND (c.session_token = p_session_token OR (auth.uid() IS NOT NULL AND c.user_id = auth.uid()))
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT m.id, m.conversation_id, m.role, m.content, m.tool_calls, m.tool_call_id, m.metadata, m.created_at
  FROM public.ai_messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_create_conversation(
  p_session_id text,
  p_session_token text,
  p_title text DEFAULT 'New Conversation'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conv_id uuid;
  v_user_id uuid;
BEGIN
  IF p_session_token IS NULL OR trim(p_session_token) = '' THEN
    RAISE EXCEPTION 'Session token is required';
  END IF;

  v_user_id := auth.uid();

  INSERT INTO public.ai_conversations (user_id, session_id, session_token, title, created_at, updated_at)
  VALUES (v_user_id, COALESCE(p_session_id, gen_random_uuid()::text), p_session_token, COALESCE(p_title, 'New Conversation'), now(), now())
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_save_message(
  p_conversation_id uuid,
  p_session_token text,
  p_role text,
  p_content text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_tool_calls jsonb DEFAULT NULL,
  p_tool_call_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msg_id uuid;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = p_conversation_id
      AND (c.session_token = p_session_token OR (auth.uid() IS NOT NULL AND c.user_id = auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid session token for conversation';
  END IF;

  INSERT INTO public.ai_messages (
    conversation_id, role, content, metadata, tool_calls, tool_call_id, created_at
  ) VALUES (
    p_conversation_id, p_role, p_content, COALESCE(p_metadata, '{}'::jsonb), p_tool_calls, p_tool_call_id, now()
  ) RETURNING id INTO v_msg_id;

  UPDATE public.ai_conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_msg_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_update_conversation_title(
  p_conversation_id uuid,
  p_session_token text,
  p_title text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_conversations
  SET title = trim(p_title), updated_at = now()
  WHERE id = p_conversation_id
    AND (session_token = p_session_token OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_delete_conversation(
  p_conversation_id uuid,
  p_session_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_conversations
  WHERE id = p_conversation_id
    AND (session_token = p_session_token OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_clear_conversations(
  p_session_token text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_session_token IS NULL OR trim(p_session_token) = '' THEN
    RETURN 0;
  END IF;

  WITH deleted AS (
    DELETE FROM public.ai_conversations
    WHERE session_token = p_session_token
       OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM deleted;

  RETURN v_count;
END;
$$;


-- 3. Database Tools for AI (Phase 3)
-- Validated, read-only functions strictly enforcing approved status and sanitizing private fields.

-- Tool 1: search_menu_items
CREATE OR REPLACE FUNCTION public.ai_search_menu_items(
  p_query text,
  p_veg_type text DEFAULT 'all',
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_available_only boolean DEFAULT true,
  p_limit int DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
  v_clean_q text;
  v_veg text;
BEGIN
  v_clean_q := trim(COALESCE(p_query, ''));
  v_veg := COALESCE(NULLIF(trim(p_veg_type), ''), 'all');

  SELECT jsonb_agg(item) INTO v_results
  FROM (
    SELECT
      f.id,
      f.name,
      f.slug,
      f.description,
      f.veg_type,
      f.image_url,
      f.available,
      r.id AS restaurant_id,
      r.name AS restaurant_name,
      r.slug AS restaurant_slug,
      r.area AS restaurant_area,
      r.city AS restaurant_city,
      r.verified AS restaurant_verified,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'id', fv.id,
          'name', fv.name,
          'price', fv.price,
          'available', fv.available
        ) ORDER BY fv.price ASC)
        FROM public.food_variants fv
        WHERE fv.food_id = f.id
          AND (NOT p_available_only OR fv.available = true)
          AND (p_min_price IS NULL OR fv.price >= p_min_price)
          AND (p_max_price IS NULL OR fv.price <= p_max_price)
        ), '[]'::jsonb
      ) AS variants,
      (SELECT min(fv.price) FROM public.food_variants fv WHERE fv.food_id = f.id AND (NOT p_available_only OR fv.available = true)) AS starting_price
    FROM public.foods f
    JOIN public.restaurants r ON r.id = f.restaurant_id
    WHERE r.status = 'approved'
      AND f.status = 'active'
      AND (NOT p_available_only OR f.available = true)
      AND (v_veg = 'all' OR f.veg_type = v_veg)
      AND (
        v_clean_q = '' OR
        f.name ILIKE '%' || v_clean_q || '%' OR
        f.description ILIKE '%' || v_clean_q || '%' OR
        EXISTS (SELECT 1 FROM public.categories c WHERE c.id = f.category_id AND c.name ILIKE '%' || v_clean_q || '%')
      )
      AND (
        p_min_price IS NULL AND p_max_price IS NULL OR
        EXISTS (
          SELECT 1 FROM public.food_variants fv
          WHERE fv.food_id = f.id
            AND (p_min_price IS NULL OR fv.price >= p_min_price)
            AND (p_max_price IS NULL OR fv.price <= p_max_price)
        )
      )
    ORDER BY
      CASE WHEN v_clean_q <> '' AND f.name ILIKE v_clean_q THEN 1
           WHEN v_clean_q <> '' AND f.name ILIKE v_clean_q || '%' THEN 2
           ELSE 3 END ASC,
      f.name ASC
    LIMIT LEAST(p_limit, 20)
  ) item;

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- Tool 2: search_restaurants
CREATE OR REPLACE FUNCTION public.ai_search_restaurants(
  p_query text,
  p_area text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_limit int DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
  v_clean_q text;
BEGIN
  v_clean_q := trim(COALESCE(p_query, ''));

  SELECT jsonb_agg(res) INTO v_results
  FROM (
    SELECT
      r.id,
      r.name,
      r.slug,
      r.description,
      r.address,
      r.area,
      r.city,
      r.verified,
      r.category,
      r.logo_url,
      r.cover_url,
      r.latitude,
      r.longitude,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'day_of_week', h.day_of_week,
          'open_time', h.open_time,
          'close_time', h.close_time,
          'is_closed', h.is_closed
        )) FROM public.restaurant_hours h WHERE h.restaurant_id = r.id),
        '[]'::jsonb
      ) AS hours,
      (SELECT count(*) FROM public.foods f WHERE f.restaurant_id = r.id AND f.status = 'active') AS active_food_count
    FROM public.restaurants r
    WHERE r.status = 'approved'
      AND (p_area IS NULL OR r.area ILIKE '%' || trim(p_area) || '%')
      AND (p_city IS NULL OR r.city ILIKE '%' || trim(p_city) || '%')
      AND (p_category IS NULL OR r.category ILIKE '%' || trim(p_category) || '%')
      AND (
        v_clean_q = '' OR
        r.name ILIKE '%' || v_clean_q || '%' OR
        r.description ILIKE '%' || v_clean_q || '%' OR
        r.area ILIKE '%' || v_clean_q || '%' OR
        r.category ILIKE '%' || v_clean_q || '%'
      )
    ORDER BY
      CASE WHEN v_clean_q <> '' AND r.name ILIKE v_clean_q THEN 1
           WHEN v_clean_q <> '' AND r.name ILIKE v_clean_q || '%' THEN 2
           ELSE 3 END ASC,
      r.name ASC
    LIMIT LEAST(p_limit, 20)
  ) res;

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;

-- Tool 3: get_restaurant_menu
CREATE OR REPLACE FUNCTION public.ai_get_restaurant_menu(
  p_identifier text,
  p_veg_type text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res_id uuid;
  v_res_record record;
  v_menu jsonb;
  v_veg text;
BEGIN
  v_veg := COALESCE(NULLIF(trim(p_veg_type), ''), 'all');

  -- Find restaurant by ID or slug
  SELECT id, name, slug, area, city, status INTO v_res_record
  FROM public.restaurants
  WHERE (id::text = p_identifier OR slug = p_identifier)
    AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Restaurant not found or not approved');
  END IF;

  v_res_id := v_res_record.id;

  SELECT jsonb_agg(cat_group) INTO v_menu
  FROM (
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.sort_order,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'slug', f.slug,
          'description', f.description,
          'veg_type', f.veg_type,
          'image_url', f.image_url,
          'available', f.available,
          'variants', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', v.id,
              'name', v.name,
              'price', v.price,
              'available', v.available
            ) ORDER BY v.price ASC)
            FROM public.food_variants v
            WHERE v.food_id = f.id
          ), '[]'::jsonb)
        ) ORDER BY f.name ASC)
        FROM public.foods f
        WHERE f.category_id = c.id
          AND f.restaurant_id = v_res_id
          AND f.status = 'active'
          AND (v_veg = 'all' OR f.veg_type = v_veg)
        ), '[]'::jsonb
      ) AS items
    FROM public.categories c
    WHERE c.restaurant_id = v_res_id
    ORDER BY c.sort_order ASC, c.name ASC
  ) cat_group;

  RETURN jsonb_build_object(
    'restaurant_id', v_res_record.id,
    'restaurant_name', v_res_record.name,
    'restaurant_slug', v_res_record.slug,
    'area', v_res_record.area,
    'city', v_res_record.city,
    'menu', COALESCE(v_menu, '[]'::jsonb)
  );
END;
$$;

-- Tool 4: get_restaurant_details
CREATE OR REPLACE FUNCTION public.ai_get_restaurant_details(p_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'slug', r.slug,
    'description', r.description,
    'address', r.address,
    'area', r.area,
    'city', r.city,
    'latitude', r.latitude,
    'longitude', r.longitude,
    'verified', r.verified,
    'category', r.category,
    'website', r.website,
    'logo_url', r.logo_url,
    'cover_url', r.cover_url,
    'hours', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'day_of_week', h.day_of_week,
        'open_time', h.open_time,
        'close_time', h.close_time,
        'is_closed', h.is_closed
      )) FROM public.restaurant_hours h WHERE h.restaurant_id = r.id),
      '[]'::jsonb
    ),
    'active_food_count', (SELECT count(*) FROM public.foods f WHERE f.restaurant_id = r.id AND f.status = 'active'),
    'categories', COALESCE(
      (SELECT jsonb_agg(c.name) FROM public.categories c WHERE c.restaurant_id = r.id ORDER BY c.sort_order ASC),
      '[]'::jsonb
    )
  ) INTO v_res
  FROM public.restaurants r
  WHERE (r.id::text = p_identifier OR r.slug = p_identifier)
    AND r.status = 'approved';

  IF v_res IS NULL THEN
    RETURN jsonb_build_object('error', 'Restaurant not found or not approved');
  END IF;

  RETURN v_res;
END;
$$;

-- Tool 5: compare_food_prices
CREATE OR REPLACE FUNCTION public.ai_compare_food_prices(
  p_dish_name text,
  p_veg_type text DEFAULT 'all',
  p_limit int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean text;
  v_veg text;
  v_items jsonb;
  v_min_price numeric;
  v_max_price numeric;
  v_avg_price numeric;
BEGIN
  v_clean := trim(COALESCE(p_dish_name, ''));
  v_veg := COALESCE(NULLIF(trim(p_veg_type), ''), 'all');

  IF v_clean = '' THEN
    RETURN jsonb_build_object('error', 'Dish name is required');
  END IF;

  SELECT
    jsonb_agg(row_data),
    min((row_data->>'price')::numeric),
    max((row_data->>'price')::numeric),
    round(avg((row_data->>'price')::numeric), 2)
  INTO v_items, v_min_price, v_max_price, v_avg_price
  FROM (
    SELECT jsonb_build_object(
      'food_id', f.id,
      'food_name', f.name,
      'food_slug', f.slug,
      'veg_type', f.veg_type,
      'image_url', f.image_url,
      'variant_id', fv.id,
      'variant_name', fv.name,
      'price', fv.price,
      'available', fv.available,
      'restaurant_id', r.id,
      'restaurant_name', r.name,
      'restaurant_slug', r.slug,
      'area', r.area,
      'city', r.city
    ) AS row_data
    FROM public.food_variants fv
    JOIN public.foods f ON f.id = fv.food_id
    JOIN public.restaurants r ON r.id = f.restaurant_id
    WHERE r.status = 'approved'
      AND f.status = 'active'
      AND fv.available = true
      AND (v_veg = 'all' OR f.veg_type = v_veg)
      AND (f.name ILIKE '%' || v_clean || '%' OR fv.name ILIKE '%' || v_clean || '%')
    ORDER BY fv.price ASC
    LIMIT LEAST(p_limit, 20)
  ) sub;

  RETURN jsonb_build_object(
    'dish_query', v_clean,
    'total_matches', COALESCE(jsonb_array_length(v_items), 0),
    'min_price', v_min_price,
    'max_price', v_max_price,
    'avg_price', v_avg_price,
    'comparisons', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;

