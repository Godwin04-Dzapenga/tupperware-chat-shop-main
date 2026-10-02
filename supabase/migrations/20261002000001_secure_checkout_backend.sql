-- Secure checkout/payment foundation for Tech Innovation
-- Normalizes payment providers/statuses, fixes audit-log actor column,
-- adds idempotency and payment timestamps, and hardens admin RLS.

CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role::text = p_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Admins manage product variants" ON public.product_variants;
CREATE POLICY "Admins manage product variants"
  ON public.product_variants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view transactions" ON public.transactions;
CREATE POLICY "Only admins can view transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view stock movements" ON public.stock_movements;
CREATE POLICY "Only admins can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS initiated_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON public.payments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider, provider_ref);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'initiated',
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- Payment provider is intentionally normalized to the backend provider,
-- while the checkout UI can select a specific method (EcoCash/OneMoney/card).
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('paynow','stripe','cash_on_delivery','whatsapp'));

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('initiated','pending','paid','failed','cancelled','expired','refunded'));

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_idempotency_key text,
  p_user_id uuid,
  p_guest_email text,
  p_guest_name text,
  p_guest_phone text,
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_line1 text,
  p_shipping_city text,
  p_shipping_country text,
  p_subtotal numeric,
  p_discount_total numeric,
  p_shipping_fee numeric,
  p_total numeric,
  p_currency text,
  p_coupon_code text,
  p_notes text,
  p_payment_provider text,
  p_payment_method text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_item jsonb;
  v_qty integer;
  v_product_id uuid;
  v_variant_id uuid;
BEGIN
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 16 THEN
    RAISE EXCEPTION 'Invalid idempotency key';
  END IF;

  SELECT o.* INTO v_order
  FROM orders o
  JOIN payments p ON p.order_id = o.id
  WHERE p.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    SELECT * INTO v_payment FROM payments WHERE order_id = v_order.id ORDER BY created_at DESC LIMIT 1;
    RETURN jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number, 'total', v_order.total, 'payment_id', v_payment.id, 'replayed', true);
  END IF;

  INSERT INTO orders (
    order_number,user_id,guest_email,guest_name,guest_phone,status,
    subtotal,discount_total,shipping_fee,total,currency,
    shipping_name,shipping_phone,shipping_line1,shipping_city,shipping_country,
    coupon_code,notes,payment_status,payment_provider,payment_reference
  ) VALUES (
    generate_order_number(),p_user_id,p_guest_email,p_guest_name,p_guest_phone,'pending',
    p_subtotal,p_discount_total,p_shipping_fee,p_total,p_currency,
    p_shipping_name,p_shipping_phone,p_shipping_line1,p_shipping_city,p_shipping_country,
    p_coupon_code,p_notes,'initiated',p_payment_provider,NULL
  ) RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id','')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    IF v_variant_id IS NOT NULL THEN
      PERFORM decrement_variant_stock(v_variant_id, v_qty);
    ELSE
      PERFORM decrement_stock(v_product_id, v_qty);
    END IF;

    INSERT INTO order_items(order_id,product_id,variant_id,variant_name,product_name,unit_price,quantity,line_total)
    VALUES (
      v_order.id,v_product_id,v_variant_id,v_item->>'variant_name',
      v_item->>'product_name',(v_item->>'unit_price')::numeric,v_qty,(v_item->>'line_total')::numeric
    );

    INSERT INTO stock_movements(product_id,quantity,movement_type,reason,created_by)
    VALUES (v_product_id,-v_qty,'out','Order '||v_order.order_number||CASE WHEN v_variant_id IS NULL THEN '' ELSE ' / variant '||v_variant_id::text END,p_user_id);
  END LOOP;

  INSERT INTO payments(order_id,provider,provider_ref,amount,currency,status,initiated_at,idempotency_key)
  VALUES (
    v_order.id,p_payment_provider,NULL,p_total,p_currency,
    CASE WHEN p_payment_provider='cash_on_delivery' THEN 'pending' ELSE 'initiated' END,
    now(),p_idempotency_key
  ) RETURNING * INTO v_payment;

  INSERT INTO audit_log(actor_id,user_id,action,entity,entity_id,diff)
  VALUES (p_user_id,p_user_id,'create','orders',v_order.id,jsonb_build_object(
    'order_number',v_order.order_number,'total',p_total,'payment_provider',p_payment_provider,'payment_method',p_payment_method
  ));

  RETURN jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'total',v_order.total,'payment_id',v_payment.id,'replayed',false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order(text,uuid,text,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(text,uuid,text,text,text,text,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,text,text,jsonb) TO service_role;
