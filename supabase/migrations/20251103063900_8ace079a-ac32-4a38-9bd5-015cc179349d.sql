-- Create storage bucket for product media
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true);

-- Allow anyone to view files in the bucket
CREATE POLICY "Anyone can view product media"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

-- Allow admins to upload files
CREATE POLICY "Admins can upload product media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update files
CREATE POLICY "Admins can update product media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete product media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add video_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;