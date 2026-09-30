-- Tech Innovation solar & electronics catalogue extension
-- Adds structured technical fields without breaking existing ecommerce data.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model_number text,
  ADD COLUMN IF NOT EXISTS power_watts numeric(10,2),
  ADD COLUMN IF NOT EXISTS voltage text,
  ADD COLUMN IF NOT EXISTS capacity text,
  ADD COLUMN IF NOT EXISTS warranty_months integer,
  ADD COLUMN IF NOT EXISTS installation_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_power_watts ON public.products(power_watts);

COMMENT ON COLUMN public.products.specifications IS 'Technical product specifications such as panel technology, battery chemistry, inverter phase, dimensions and included accessories.';

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
SELECT * FROM (VALUES
  ('Solar Panels', 'solar-panels', 'Monocrystalline and other solar PV panels.', true, 10),
  ('Inverters', 'inverters', 'Hybrid, off-grid and backup power inverters.', true, 20),
  ('Batteries', 'batteries', 'Lithium, gel and other energy storage solutions.', true, 30),
  ('Solar Kits', 'solar-kits', 'Complete solar and backup power packages.', true, 40),
  ('Electrical', 'electrical', 'Electrical accessories, protection and installation equipment.', true, 50),
  ('Electronics', 'electronics', 'Practical electronics and smart devices.', true, 60),
  ('Lighting', 'lighting', 'Solar and backup lighting solutions.', true, 70),
  ('Accessories', 'solar-accessories', 'Cables, connectors, mounting and system accessories.', true, 80)
) AS seed(name, slug, description, is_active, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.slug = seed.slug
);
