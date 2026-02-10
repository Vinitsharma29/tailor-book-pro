
-- Create storage bucket for bill PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('bills', 'bills', true);

-- Allow authenticated users to upload bills
CREATE POLICY "Authenticated users can upload bills"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bills');

-- Allow public read access to bills
CREATE POLICY "Public can read bills"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bills');

-- Allow users to update their own bills
CREATE POLICY "Users can update their own bills"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bills');

-- Allow users to delete their own bills
CREATE POLICY "Users can delete their own bills"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bills');
