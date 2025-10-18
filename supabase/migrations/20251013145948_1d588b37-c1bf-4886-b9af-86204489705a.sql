-- Add parent_category_id and category_type to categories table
ALTER TABLE public.categories 
ADD COLUMN parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN category_type TEXT CHECK (category_type IN ('veg', 'non-veg', 'main'));

-- Update existing categories to be 'main' type
UPDATE public.categories SET category_type = 'main';

-- Insert new main categories
INSERT INTO public.categories (name, category_type) VALUES
('Sandwiches', 'main'),
('Waffles', 'main'),
('Fresh Juices', 'main'),
('Mojitos', 'main'),
('Pasta', 'main'),
('Ice Creams', 'main')
ON CONFLICT DO NOTHING;