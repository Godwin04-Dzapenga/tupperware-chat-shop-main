-- Fix profiles RLS policy to prevent email exposure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add database constraints for data validation
ALTER TABLE public.products
ADD CONSTRAINT products_price_positive CHECK (price >= 0),
ADD CONSTRAINT products_cost_price_positive CHECK (cost_price >= 0),
ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
ADD CONSTRAINT products_reorder_level_non_negative CHECK (reorder_level >= 0),
ADD CONSTRAINT products_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT products_name_max_length CHECK (length(name) <= 200),
ADD CONSTRAINT products_description_max_length CHECK (description IS NULL OR length(description) <= 2000),
ADD CONSTRAINT products_sku_max_length CHECK (sku IS NULL OR length(sku) <= 100);

-- Add constraints to categories
ALTER TABLE public.categories
ADD CONSTRAINT categories_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT categories_name_max_length CHECK (length(name) <= 100),
ADD CONSTRAINT categories_slug_max_length CHECK (length(slug) <= 100);

-- Add constraints to transactions
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_amount_not_zero CHECK (amount != 0),
ADD CONSTRAINT transactions_description_max_length CHECK (description IS NULL OR length(description) <= 500),
ADD CONSTRAINT transactions_category_max_length CHECK (length(category) <= 100);

-- Add constraints to stock_movements
ALTER TABLE public.stock_movements
ADD CONSTRAINT stock_movements_quantity_not_zero CHECK (quantity != 0),
ADD CONSTRAINT stock_movements_reason_max_length CHECK (reason IS NULL OR length(reason) <= 200),
ADD CONSTRAINT stock_movements_notes_max_length CHECK (notes IS NULL OR length(notes) <= 1000);

-- Add constraints to visitor_logs
ALTER TABLE public.visitor_logs
ADD CONSTRAINT visitor_logs_session_id_max_length CHECK (length(session_id) <= 255),
ADD CONSTRAINT visitor_logs_user_agent_max_length CHECK (user_agent IS NULL OR length(user_agent) <= 1000),
ADD CONSTRAINT visitor_logs_page_path_max_length CHECK (page_path IS NULL OR length(page_path) <= 500);