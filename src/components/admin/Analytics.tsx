import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ChevronRight } from "lucide-react";

interface CategoryStats {
  category_name: string;
  category_id: string;
  product_count: number;
}

interface MenuItem {
  id: string;
  name: string;
  image_url?: string;
  price: number;
}

const Analytics = () => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: items } = await supabase
      .from("menu_items")
      .select("category_id");

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");

    if (items && categories) {
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      const counts: { [key: string]: { name: string; id: string; count: number } } = {};

      items.forEach(item => {
        const catId = item.category_id || "uncategorized";
        const catName = item.category_id ? categoryMap.get(item.category_id) || "Uncategorized" : "Uncategorized";
        
        if (!counts[catId]) {
          counts[catId] = { name: catName, id: catId, count: 0 };
        }
        counts[catId].count++;
      });

      const statsData = Object.values(counts).map(cat => ({
        category_name: cat.name,
        category_id: cat.id,
        product_count: cat.count
      }));

      setStats(statsData);
      setTotalProducts(items.length);
    }
  };

  const handleCategoryClick = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    const { data } = await supabase
      .from("menu_items")
      .select("id, name, image_url, price")
      .eq("category_id", categoryId);

    if (data) {
      setCategoryProducts(data);
    }
  };

  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {stats.find(s => s.category_id === selectedCategory)?.category_name} Products
              </CardTitle>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary hover:underline"
              >
                ← Back to Analytics
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-3 hover:shadow-lg transition-shadow">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                  )}
                  <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Product Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-3xl font-bold">{totalProducts}</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Products by Category (Click to view)</h3>
            {stats.map((stat) => (
              <div
                key={stat.category_id}
                className="space-y-2 cursor-pointer hover:bg-secondary/50 p-3 rounded-lg transition-colors"
                onClick={() => handleCategoryClick(stat.category_id)}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{stat.category_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{stat.product_count} items</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(stat.product_count / totalProducts) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
