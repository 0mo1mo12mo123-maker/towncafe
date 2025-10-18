import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  subcategory_support?: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subcategorySupport, setSubcategorySupport] = useState<string>("both");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) setCategories(data);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSubcategorySupport(category.subcategory_support || "both");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will unlink all menu items from this category.")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting category");
    } else {
      toast.success("Category deleted successfully");
      fetchCategories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({ 
            name: categoryName,
            subcategory_support: subcategorySupport
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ 
            name: categoryName,
            subcategory_support: subcategorySupport
          });

        if (error) throw error;
        toast.success("Category created");
      }

      setIsDialogOpen(false);
      setCategoryName("");
      setSubcategorySupport("both");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categories</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setCategoryName(""); 
              setSubcategorySupport("both");
              setEditingCategory(null); 
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  placeholder="e.g., Burgers"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subcategory Support</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="both"
                      name="subcategory"
                      value="both"
                      checked={subcategorySupport === "both"}
                      onChange={(e) => setSubcategorySupport(e.target.value)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="both" className="cursor-pointer font-normal">Both Veg and Non-Veg</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="veg"
                      name="subcategory"
                      value="veg"
                      checked={subcategorySupport === "veg"}
                      onChange={(e) => setSubcategorySupport(e.target.value)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="veg" className="cursor-pointer font-normal">Veg Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="non_veg"
                      name="subcategory"
                      value="non_veg"
                      checked={subcategorySupport === "non_veg"}
                      onChange={(e) => setSubcategorySupport(e.target.value)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="non_veg" className="cursor-pointer font-normal">Non-Veg Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="none"
                      name="subcategory"
                      value="none"
                      checked={subcategorySupport === "none"}
                      onChange={(e) => setSubcategorySupport(e.target.value)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="none" className="cursor-pointer font-normal">No Subcategories</Label>
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(category)} size="icon" variant="outline">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(category.id)} size="icon" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
