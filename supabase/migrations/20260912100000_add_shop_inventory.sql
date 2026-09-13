/*
  LifeForge — Shop, Inventory, and Cosmetic Equipment

  Shop prices and ownership are database-controlled. The browser can only
  request purchase/equip operations by id.
*/

CREATE TABLE IF NOT EXISTS public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('accessory', 'outfit', 'effect', 'character')),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  price integer NOT NULL CHECK (price > 0),
  equippable boolean NOT NULL DEFAULT true,
  slot text CHECK (slot IS NULL OR slot IN ('accessory', 'outfit', 'effect')),
  appearance_key text,
  is_purchasable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE RESTRICT,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  equipped_at timestamptz,
  UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.shop_items(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'reward', 'adjustment')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_equipped ON public.inventory_items(user_id, equipped_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_date
  ON public.coin_transactions(user_id, created_at DESC);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_shop_items" ON public.shop_items;
CREATE POLICY "select_shop_items" ON public.shop_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "select_own_inventory_items" ON public.inventory_items;
CREATE POLICY "select_own_inventory_items" ON public.inventory_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_coin_transactions" ON public.coin_transactions;
CREATE POLICY "select_own_coin_transactions" ON public.coin_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.shop_items FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.inventory_items FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.coin_transactions FROM authenticated;
GRANT SELECT ON public.shop_items, public.inventory_items, public.coin_transactions TO authenticated;

INSERT INTO public.shop_items
  (slug, name, description, category, rarity, price, slot, appearance_key)
VALUES
  ('ember-aura', 'Ember Aura', 'A warm, controlled glow for a hero who keeps moving.', 'effect', 'rare', 80, 'effect', 'ember-aura'),
  ('focus-circlet', 'Focus Circlet', 'A minimal circlet for deep work and clear thinking.', 'accessory', 'common', 45, 'accessory', 'focus-circlet'),
  ('night-runner', 'Night Runner', 'A sleek silhouette for quiet momentum after dark.', 'outfit', 'epic', 150, 'outfit', 'night-runner'),
  ('sunward-mantle', 'Sunward Mantle', 'A bright mantle that marks a consistent finisher.', 'outfit', 'legendary', 300, 'outfit', 'sunward-mantle'),
  ('scholar-ink', 'Scholar Ink', 'A subtle knowledge-mark for builders and learners.', 'accessory', 'rare', 90, 'accessory', 'scholar-ink'),
  ('steady-hand', 'Steady Hand', 'A restrained effect for deliberate progress.', 'effect', 'common', 60, 'effect', 'steady-hand'),
  ('forge-mark', 'Forge Mark', 'A permanent-looking mark of the LifeForge path.', 'character', 'epic', 220, NULL, 'forge-mark'),
  ('quiet-gold', 'Quiet Gold', 'A small accent for milestones earned without noise.', 'accessory', 'rare', 120, 'accessory', 'quiet-gold')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  price = EXCLUDED.price,
  slot = EXCLUDED.slot,
  appearance_key = EXCLUDED.appearance_key,
  is_purchasable = true;

CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item public.shop_items%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_inventory_id uuid;
  v_new_balance integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_item
  FROM public.shop_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_item.is_purchasable THEN
    RETURN jsonb_build_object('error', 'This item is not available');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.inventory_items
    WHERE user_id = auth.uid() AND item_id = v_item.id
  ) THEN
    RETURN jsonb_build_object('error', 'You already own this item');
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF v_profile.coins < v_item.price THEN
    RETURN jsonb_build_object(
      'error', 'Not enough coins',
      'price', v_item.price,
      'coins_available', v_profile.coins
    );
  END IF;

  v_new_balance := v_profile.coins - v_item.price;

  UPDATE public.profiles
  SET coins = v_new_balance
  WHERE id = auth.uid();

  INSERT INTO public.inventory_items (user_id, item_id)
  VALUES (auth.uid(), v_item.id)
  RETURNING id INTO v_inventory_id;

  INSERT INTO public.coin_transactions
    (user_id, item_id, transaction_type, amount, balance_after, metadata)
  VALUES
    (auth.uid(), v_item.id, 'purchase', -v_item.price, v_new_balance,
      jsonb_build_object('item_slug', v_item.slug, 'item_name', v_item.name));

  RETURN jsonb_build_object(
    'success', true,
    'inventory_id', v_inventory_id,
    'item_id', v_item.id,
    'item_name', v_item.name,
    'price', v_item.price,
    'coins_remaining', v_new_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_inventory_item(p_inventory_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inventory public.inventory_items%ROWTYPE;
  v_item public.shop_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT ii.* INTO v_inventory
  FROM public.inventory_items ii
  WHERE ii.id = p_inventory_id AND ii.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Owned item not found');
  END IF;

  SELECT * INTO v_item
  FROM public.shop_items
  WHERE id = v_inventory.item_id;

  IF NOT FOUND OR NOT v_item.equippable OR v_item.slot IS NULL THEN
    RETURN jsonb_build_object('error', 'This item cannot be equipped');
  END IF;

  UPDATE public.inventory_items ii
  SET equipped_at = NULL
  FROM public.shop_items other_item
  WHERE ii.item_id = other_item.id
    AND ii.user_id = auth.uid()
    AND other_item.slot = v_item.slot
    AND ii.id <> v_inventory.id;

  UPDATE public.inventory_items
  SET equipped_at = now()
  WHERE id = v_inventory.id;

  RETURN jsonb_build_object(
    'success', true,
    'inventory_id', v_inventory.id,
    'item_id', v_item.id,
    'slot', v_item.slot,
    'appearance_key', v_item.appearance_key
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unequip_inventory_item(p_inventory_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  UPDATE public.inventory_items
  SET equipped_at = NULL
  WHERE id = p_inventory_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Owned item not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'inventory_id', p_inventory_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_shop_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_inventory_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unequip_inventory_item(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.purchase_shop_item(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.equip_inventory_item(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unequip_inventory_item(uuid) FROM PUBLIC, anon;