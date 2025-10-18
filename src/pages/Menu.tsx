import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuCard from "@/components/MenuCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  subcategory_support?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  image_url?: string;
  category_id?: string;
  is_cafe_special?: boolean;
  is_fast_selling?: boolean;
  food_type?: string;
  images?: string[];
}

interface ComboBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
}

interface ComboOffer {
  combo_name: string;
  combo_price: number;
}

const Menu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [comboOffers, setComboOffers] = useState<Record<string, ComboOffer[]>>({});
  const [comboBundles, setComboBundles] = useState<ComboBundle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes, combosRes, bundlesRes, imagesRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("menu_items").select("*").order("name"),
        supabase.from("combo_offers").select("*"),
        supabase.from("combo_bundles").select("*").order("name"),
        supabase.from("menu_item_images").select("*").order("menu_item_id, display_order")
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      
      // Map images to menu items
      if (itemsRes.data) {
        const imagesMap: Record<string, string[]> = {};
        if (imagesRes.data) {
          imagesRes.data.forEach((img) => {
            if (!imagesMap[img.menu_item_id]) {
              imagesMap[img.menu_item_id] = [];
            }
            imagesMap[img.menu_item_id].push(img.image_url);
          });
        }
        
        const itemsWithImages = itemsRes.data.map(item => ({
          ...item,
          images: imagesMap[item.id] || []
        }));
        setMenuItems(itemsWithImages);
      }
      
      if (bundlesRes.data) setComboBundles(bundlesRes.data);
      
      if (combosRes.data) {
        const combosMap: Record<string, ComboOffer[]> = {};
        combosRes.data.forEach((combo) => {
          if (!combosMap[combo.menu_item_id]) {
            combosMap[combo.menu_item_id] = [];
          }
          combosMap[combo.menu_item_id].push({
            combo_name: combo.combo_name,
            combo_price: combo.combo_price
          });
        });
        setComboOffers(combosMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const cafeSpecialItems = menuItems.filter(item => item.is_cafe_special);
  
  // Get the Combo Bundles category
  const comboBundlesCategory = categories.find(cat => cat.name === "Combo Bundles");
  
  // Filter items based on selected category and subcategory
  const getFilteredItems = () => {
    let items = menuItems.filter(item => !item.is_cafe_special);
    
    // If Combo Bundles category is selected, show combo bundles
    if (selectedCategory === comboBundlesCategory?.id) {
      return []; // We'll show comboBundles separately
    }
    
    // Filter by category
    if (selectedCategory) {
      items = items.filter(item => item.category_id === selectedCategory);
    }
    
    // Filter by subcategory (veg/non-veg)
    if (selectedSubcategory) {
      items = items.filter(item => item.food_type === selectedSubcategory);
    }
    
    return items;
  };
  
  const filteredItems = getFilteredItems();
  
  // Get the currently selected category to check subcategory support
  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const showSubcategories = currentCategory?.subcategory_support === 'both';
  
  // Check if we should show combo bundles
  const showComboBundles = selectedCategory === comboBundlesCategory?.id || selectedCategory === null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-12 text-secondary">Our Menu</h1>

        {cafeSpecialItems.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
              ⭐ Cafe Specials
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cafeSpecialItems.map((item) => (
                <MenuCard
                  key={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  discounted_price={item.discounted_price}
                  image_url={item.image_url}
                  images={item.images}
                  combo_offers={comboOffers[item.id]}
                  is_fast_selling={item.is_fast_selling}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max px-4">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
              className={selectedCategory === null ? "bg-gradient-to-r from-primary to-accent whitespace-nowrap" : "whitespace-nowrap"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubcategory(null);
                }}
                className={selectedCategory === category.id ? "bg-gradient-to-r from-primary to-accent whitespace-nowrap" : "whitespace-nowrap"}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {showSubcategories && (
          <div className="mb-8 flex justify-center gap-2">
            <Button
              variant={selectedSubcategory === null ? "default" : "outline"}
              onClick={() => setSelectedSubcategory(null)}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={selectedSubcategory === 'veg' ? "default" : "outline"}
              onClick={() => setSelectedSubcategory('veg')}
              size="sm"
              className="gap-2"
            >
              🌱 Veg
            </Button>
            <Button
              variant={selectedSubcategory === 'non_veg' ? "default" : "outline"}
              onClick={() => setSelectedSubcategory('non_veg')}
              size="sm"
              className="gap-2"
            >
              🍖 Non-Veg
            </Button>
          </div>
        )}

{loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {showComboBundles && comboBundles.length > 0 && selectedCategory === comboBundlesCategory?.id && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
                  🎁 Combo Bundles
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {comboBundles.map((bundle) => (
                    <MenuCard
                      key={bundle.id}
                      name={bundle.name}
                      description={bundle.description}
                      price={bundle.price}
                      image_url={bundle.image_url}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    discounted_price={item.discounted_price}
                    image_url={item.image_url}
                    images={item.images}
                    combo_offers={comboOffers[item.id]}
                    is_fast_selling={item.is_fast_selling}
                    food_type={item.food_type}
                  />
                ))}
              </div>
            ) : selectedCategory && selectedCategory !== comboBundlesCategory?.id ? (
              <div className="text-center py-20">
                <p className="text-2xl text-muted-foreground">No items found in this category</p>
              </div>
            ) : null}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Menu;
