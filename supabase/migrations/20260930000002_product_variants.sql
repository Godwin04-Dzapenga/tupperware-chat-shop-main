-- Tech Innovation: product variants and variant-aware checkout
-- Variants are first-class inventory records: price, stock, SKU, image and attributes.

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_product_sku_key UNIQUE (product_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_name text;

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active product variants" ON public.product_variants;
CREATE POLICY "Anyone can view active product variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage product variants" ON public.product_variants;
CREATE POLICY "Admins manage product variants"
  ON public.product_variants FOR ALL
  USING (public.has_role('admin', auth.uid()))
  WITH CHECK (public.has_role('admin', auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_product_variant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_variant();

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  WHERE id = p_variant_id
    AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient variant stock';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer) TO service_role;
