-- Add flags to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN is_cafe_special BOOLEAN DEFAULT false,
ADD COLUMN is_fast_selling BOOLEAN DEFAULT false;

-- Create combo_bundles table
CREATE TABLE public.combo_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combo_bundle_items junction table
CREATE TABLE public.combo_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_bundle_id UUID NOT NULL REFERENCES public.combo_bundles(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.combo_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for combo_bundles
CREATE POLICY "Anyone can view combo bundles"
ON public.combo_bundles FOR SELECT USING (true);

CREATE POLICY "Admin can insert combo bundles"
ON public.combo_bundles FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admin can update combo bundles"
ON public.combo_bundles FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admin can delete combo bundles"
ON public.combo_bundles FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- RLS Policies for combo_bundle_items
CREATE POLICY "Anyone can view combo bundle items"
ON public.combo_bundle_items FOR SELECT USING (true);

CREATE POLICY "Admin can insert combo bundle items"
ON public.combo_bundle_items FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admin can update combo bundle items"
ON public.combo_bundle_items FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admin can delete combo bundle items"
ON public.combo_bundle_items FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));