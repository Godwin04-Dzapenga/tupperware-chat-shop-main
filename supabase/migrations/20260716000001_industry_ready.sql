-- ================================================================
-- TuppAfrica — Industry-Ready Migration
-- Fixes: RLS data leaks on transactions & stock_movements
-- Adds:  addresses, orders, order_items, payments, reviews,
--        wishlist_items, coupons, notifications, audit_log
-- ================================================================

-- ── 1. FIX RLS LEAKS (transactions & stock_movements were public) ──────────
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view stock movements" ON public.stock_movements;

CREATE POLICY "Only admins can view transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 2. ADDRESSES ───────────────────────────────────────────────────────────
CREATE TABLE public.addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label           text,
  recipient_name  text NOT NULL CHECK (length(trim(recipient_name)) > 0),
  phone           text NOT NULL CHECK (length(trim(phone)) > 0),
  line1           text NOT NULL CHECK (length(trim(line1)) > 0),
  line2           text,
  city            text NOT NULL DEFAULT 'Harare',
  country         text NOT NULL DEFAULT 'Zimbabwe',
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.addresses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. ORDERS ──────────────────────────────────────────────────────────────
CREATE TYPE public.order_status AS ENUM
  ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email         text,
  guest_name          text,
  guest_phone         text,
  status              public.order_status NOT NULL DEFAULT 'pending',
  subtotal            numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_total      numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  shipping_fee        numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total               numeric(10,2) NOT NULL CHECK (total >= 0),
  currency            text NOT NULL DEFAULT 'USD',
  shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  shipping_name       text,
  shipping_phone      text,
  shipping_line1      text,
  shipping_city       text,
  shipping_country    text,
  coupon_code         text,
  notes               text,
  whatsapp_sent       boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- orders are inserted by the checkout edge function (service role), not directly
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_user_id    ON public.orders(user_id);
CREATE INDEX idx_orders_status     ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ── 4. ORDER ITEMS ─────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price   numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity     integer NOT NULL CHECK (quantity > 0),
  line_total   numeric(10,2) NOT NULL CHECK (line_total >= 0)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ── 5. PAYMENTS ────────────────────────────────────────────────────────────
CREATE TYPE public.payment_status AS ENUM
  ('initiated', 'pending', 'paid', 'failed', 'refunded');

CREATE TABLE public.payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN ('paynow','stripe','flutterwave','cash_on_delivery','whatsapp')),
  provider_ref text,
  amount       numeric(10,2) NOT NULL CHECK (amount > 0),
  currency     text NOT NULL DEFAULT 'USD',
  status       public.payment_status NOT NULL DEFAULT 'initiated',
  raw_payload  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payments_order_id ON public.payments(order_id);

-- ── 6. REVIEWS ─────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id     uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text CHECK (comment IS NULL OR length(comment) <= 1000),
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Logged-in users can insert their own review"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_user_id    ON public.reviews(user_id);

-- Materialised avg rating on products ──────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS avg_rating   numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer       DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products
  SET
    avg_rating   = (SELECT COALESCE(AVG(rating)::numeric(3,2), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- ── 7. WISHLIST ────────────────────────────────────────────────────────────
CREATE TABLE public.wishlist_items (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 8. COUPONS ─────────────────────────────────────────────────────────────
CREATE TABLE public.coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL CHECK (length(trim(code)) > 0),
  discount_type   text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value  numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_order_total >= 0),
  usage_limit     integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  times_used      integer NOT NULL DEFAULT 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Public read for validation (code lookup — no sensitive data exposed)
CREATE POLICY "Anyone can look up active coupons by code"
  ON public.coupons FOR SELECT
  USING (active = true);

-- ── 9. NOTIFICATIONS LOG ───────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel    text NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  recipient  text NOT NULL,
  template   text NOT NULL,
  status     text NOT NULL DEFAULT 'sent',
  sent_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON public.notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);  -- edge functions use service role; this allows anon inserts for logging

-- ── 10. AUDIT LOG ──────────────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action    text NOT NULL,
  entity    text NOT NULL,
  entity_id uuid,
  diff      jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit entries"
  ON public.audit_log FOR INSERT WITH CHECK (true);

CREATE INDEX idx_audit_log_entity    ON public.audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created   ON public.audit_log(created_at DESC);

-- ── 11. ORDER-NUMBER GENERATOR ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.order_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN 'TUP-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('order_seq')::text, 5, '0');
END;
$$;

-- ── 12. STOCK DECREMENT (called inside checkout edge function) ──────────────
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$;

-- ── 13. CART PERSISTENCE ───────────────────────────────────────────────────
CREATE TABLE public.carts (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items      jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own cart"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 14. PRODUCT SEARCH INDEX ───────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price    ON public.products(price);
