import fetch from 'node:http'; // using global fetch

const apiKey = 'ik_daa0f920f6f41a632c2560a91b1297d7';
const url = 'https://yke9qwgm.us-east.insforge.app/api/database/advance/rawsql';

const sqlStatements = [
  // 1. Categories table
  `CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, name)
  );`,

  // 2. Foods table
  `CREATE TABLE IF NOT EXISTS public.foods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 150),
    slug text NOT NULL CHECK (char_length(slug) >= 1 AND char_length(slug) <= 180),
    description text CHECK (description IS NULL OR char_length(description) <= 2000),
    image_url text NULL,
    veg_type text NOT NULL CHECK (veg_type IN ('veg', 'non_veg')) DEFAULT 'non_veg',
    available boolean NOT NULL DEFAULT true,
    status text NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, slug)
  );`,

  // 3. Food variants table
  `CREATE TABLE IF NOT EXISTS public.food_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    price numeric(10, 2) NOT NULL CHECK (price >= 0),
    available boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (food_id, name)
  );`,

  // 4. Price history table
  `CREATE TABLE IF NOT EXISTS public.price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    food_variant_id uuid NOT NULL REFERENCES public.food_variants(id) ON DELETE CASCADE,
    old_price numeric(10, 2) NOT NULL,
    new_price numeric(10, 2) NOT NULL,
    changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
  );`,

  // 5. Grants on new tables
  `GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.foods, public.food_variants, public.price_history TO anon, authenticated;`,

  // 6. RLS on categories
  `ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS categories_select ON public.categories;`,
  `CREATE POLICY categories_select ON public.categories FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.status = 'approved' OR r.owner_id = auth.uid()))
  );`,
  `DROP POLICY IF EXISTS categories_insert ON public.categories;`,
  `CREATE POLICY categories_insert ON public.categories FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS categories_update ON public.categories;`,
  `CREATE POLICY categories_update ON public.categories FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS categories_delete ON public.categories;`,
  `CREATE POLICY categories_delete ON public.categories FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,

  // 7. RLS on foods
  `ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS foods_select ON public.foods;`,
  `CREATE POLICY foods_select ON public.foods FOR SELECT USING (
    (status = 'active' AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.status = 'approved'))
    OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  );`,
  `DROP POLICY IF EXISTS foods_insert ON public.foods;`,
  `CREATE POLICY foods_insert ON public.foods FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS foods_update ON public.foods;`,
  `CREATE POLICY foods_update ON public.foods FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS foods_delete ON public.foods;`,
  `CREATE POLICY foods_delete ON public.foods FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid())
  );`,

  // 8. RLS on food_variants
  `ALTER TABLE public.food_variants ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS variants_select ON public.food_variants;`,
  `CREATE POLICY variants_select ON public.food_variants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.foods f JOIN public.restaurants r ON r.id = f.restaurant_id WHERE f.id = food_id AND (r.status = 'approved' OR r.owner_id = auth.uid()))
  );`,
  `DROP POLICY IF EXISTS variants_insert ON public.food_variants;`,
  `CREATE POLICY variants_insert ON public.food_variants FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.foods f JOIN public.restaurants r ON r.id = f.restaurant_id WHERE f.id = food_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS variants_update ON public.food_variants;`,
  `CREATE POLICY variants_update ON public.food_variants FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.foods f JOIN public.restaurants r ON r.id = f.restaurant_id WHERE f.id = food_id AND r.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.foods f JOIN public.restaurants r ON r.id = f.restaurant_id WHERE f.id = food_id AND r.owner_id = auth.uid())
  );`,
  `DROP POLICY IF EXISTS variants_delete ON public.food_variants;`,
  `CREATE POLICY variants_delete ON public.food_variants FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.foods f JOIN public.restaurants r ON r.id = f.restaurant_id WHERE f.id = food_id AND r.owner_id = auth.uid())
  );`,

  // 9. RLS on price_history
  `ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS price_history_select ON public.price_history;`,
  `CREATE POLICY price_history_select ON public.price_history FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.food_variants v
      JOIN public.foods f ON f.id = v.food_id
      JOIN public.restaurants r ON r.id = f.restaurant_id
      WHERE v.id = food_variant_id AND (r.owner_id = auth.uid() OR r.status = 'approved')
    )
  );`,
  `DROP POLICY IF EXISTS price_history_insert ON public.price_history;`,
  `CREATE POLICY price_history_insert ON public.price_history FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.food_variants v
      JOIN public.foods f ON f.id = v.food_id
      JOIN public.restaurants r ON r.id = f.restaurant_id
      WHERE v.id = food_variant_id AND r.owner_id = auth.uid()
    )
  );`,

  // 10. Triggers for Price History Tracking
  `CREATE OR REPLACE FUNCTION public.track_variant_price_change()
  RETURNS trigger AS $$
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO public.price_history (food_variant_id, old_price, new_price, changed_by, changed_at)
        VALUES (NEW.id, OLD.price, NEW.price, auth.uid(), now());
      END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`,

  `DROP TRIGGER IF EXISTS trg_track_variant_price_change ON public.food_variants;`,
  `CREATE TRIGGER trg_track_variant_price_change
  BEFORE UPDATE ON public.food_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.track_variant_price_change();`,

  // 11. Trigger to update Restaurant updated_at on menu changes
  `CREATE OR REPLACE FUNCTION public.touch_restaurant_menu_update()
  RETURNS trigger AS $$
  DECLARE
    target_restaurant_id uuid;
  BEGIN
    IF TG_TABLE_NAME = 'categories' OR TG_TABLE_NAME = 'foods' THEN
      target_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
    ELSIF TG_TABLE_NAME = 'food_variants' THEN
      SELECT restaurant_id INTO target_restaurant_id FROM public.foods WHERE id = COALESCE(NEW.food_id, OLD.food_id);
    END IF;

    IF target_restaurant_id IS NOT NULL THEN
      UPDATE public.restaurants SET updated_at = now() WHERE id = target_restaurant_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`,

  `DROP TRIGGER IF EXISTS trg_touch_restaurant_categories ON public.categories;`,
  `CREATE TRIGGER trg_touch_restaurant_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_restaurant_menu_update();`,

  `DROP TRIGGER IF EXISTS trg_touch_restaurant_foods ON public.foods;`,
  `CREATE TRIGGER trg_touch_restaurant_foods
  AFTER INSERT OR UPDATE OR DELETE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.touch_restaurant_menu_update();`,

  `DROP TRIGGER IF EXISTS trg_touch_restaurant_variants ON public.food_variants;`,
  `CREATE TRIGGER trg_touch_restaurant_variants
  AFTER INSERT OR UPDATE OR DELETE ON public.food_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_restaurant_menu_update();`,

  // 12. Trigger to generate food slug
  `CREATE OR REPLACE FUNCTION public.set_food_slug()
  RETURNS trigger AS $$
  DECLARE
    base_slug text;
    temp_slug text;
    counter integer := 1;
    exists_already boolean;
  BEGIN
    IF TG_OP = 'UPDATE' AND NEW.slug = OLD.slug THEN
      RETURN NEW;
    END IF;

    IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
      base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE
      base_slug := lower(regexp_replace(NEW.slug, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
    IF base_slug = '' THEN
      base_slug := 'food-item';
    END IF;

    temp_slug := base_slug;
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM public.foods
        WHERE restaurant_id = NEW.restaurant_id AND slug = temp_slug AND (TG_OP = 'INSERT' OR id <> NEW.id)
      ) INTO exists_already;
      IF NOT exists_already THEN
        NEW.slug := temp_slug;
        EXIT;
      END IF;
      counter := counter + 1;
      temp_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.updated_at := now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`,

  `DROP TRIGGER IF EXISTS trg_set_food_slug ON public.foods;`,
  `CREATE TRIGGER trg_set_food_slug
  BEFORE INSERT OR UPDATE OF name, slug ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.set_food_slug();`
];

async function run() {
  for (let i = 0; i < sqlStatements.length; i++) {
    const s = sqlStatements[i];
    console.log(`[${i + 1}/${sqlStatements.length}] Running statement...`);
    const res = await globalThis.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ query: s })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('FAILED on SQL:', s.substring(0, 80));
      console.error('Error:', data);
      process.exit(1);
    }
  }
  console.log('PHASE 2 DATABASE SCHEMA MIGRATION SUCCESSFUL!');
}

run().catch(console.error);
