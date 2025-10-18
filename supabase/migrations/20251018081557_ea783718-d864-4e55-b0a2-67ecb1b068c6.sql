-- Add subcategory_support field to categories table
-- This indicates if a category supports veg, non-veg, or both
ALTER TABLE public.categories
ADD COLUMN subcategory_support TEXT DEFAULT 'both' CHECK (subcategory_support IN ('veg', 'non_veg', 'both', 'none'));

-- Add food_type field to menu_items table
-- This indicates if an item is veg or non-veg
ALTER TABLE public.menu_items
ADD COLUMN food_type TEXT CHECK (food_type IN ('veg', 'non_veg'));

-- Create menu_item_images table for multiple images per item
CREATE TABLE public.menu_item_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_item_images
ALTER TABLE public.menu_item_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for menu_item_images
CREATE POLICY "Anyone can view menu item images"
ON public.menu_item_images
FOR SELECT
USING (true);

CREATE POLICY "Admin can insert menu item images"
ON public.menu_item_images
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "Admin can update menu item images"
ON public.menu_item_images
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "Admin can delete menu item images"
ON public.menu_item_images
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND is_admin = true
));

-- Insert "Combo Bundles" as a regular category
INSERT INTO public.categories (name, subcategory_support)
VALUES ('Combo Bundles', 'none');

-- Update existing categories to support both veg and non-veg by default
UPDATE public.categories
SET subcategory_support = 'both'
WHERE subcategory_support IS NULL;