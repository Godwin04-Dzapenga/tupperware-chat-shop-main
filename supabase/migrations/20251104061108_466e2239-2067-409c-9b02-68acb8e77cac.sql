-- Add inventory fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS reorder_level integer DEFAULT 10 NOT NULL,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0 NOT NULL;

-- Create stock_movements table for inventory tracking
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  notes text
);

-- Enable RLS on stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_movements
CREATE POLICY "Anyone can view stock movements"
ON stock_movements FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert stock movements"
ON stock_movements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update stock movements"
ON stock_movements FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete stock movements"
ON stock_movements FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create transactions table for accounting
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  transaction_date timestamp with time zone DEFAULT now() NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Anyone can view transactions"
ON transactions FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert transactions"
ON transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update transactions"
ON transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete transactions"
ON transactions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);