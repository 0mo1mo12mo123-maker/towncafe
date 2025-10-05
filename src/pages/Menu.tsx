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
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  image_url?: string;
  category_id?: string;
}

interface ComboOffer {
  combo_name: string;
  combo_price: number;
}

const Menu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [comboOffers, setComboOffers] = useState<Record<string, ComboOffer[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes, combosRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("menu_items").select("*").order("name"),
        supabase.from("combo_offers").select("*")
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setMenuItems(itemsRes.data);
      
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

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-12 text-secondary">Our Menu</h1>
        
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? "bg-gradient-to-r from-primary to-accent" : ""}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? "bg-gradient-to-r from-primary to-accent" : ""}
            >
              {category.name}
            </Button>
          ))}
        </div>

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
        ) : filteredItems.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                name={item.name}
                description={item.description}
                price={item.price}
                discounted_price={item.discounted_price}
                image_url={item.image_url}
                combo_offers={comboOffers[item.id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">No items found in this category</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Menu;
