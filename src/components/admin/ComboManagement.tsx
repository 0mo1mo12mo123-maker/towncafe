import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ComboBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
}

interface ComboItem {
  menu_item_id: string;
  menu_item?: MenuItem;
}

const ComboManagement = () => {
  const [combos, setCombos] = useState<ComboBundle[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCombo, setEditingCombo] = useState<ComboBundle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [combosRes, itemsRes, categoriesRes] = await Promise.all([
      supabase.from("combo_bundles").select("*").order("name"),
      supabase.from("menu_items").select("*").order("name"),
      supabase.from("categories").select("*").order("name")
    ]);

    if (combosRes.data) setCombos(combosRes.data);
    if (itemsRes.data) setMenuItems(itemsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const handleEdit = async (combo: ComboBundle) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      price: combo.price,
    });

    const { data } = await supabase
      .from("combo_bundle_items")
      .select("menu_item_id")
      .eq("combo_bundle_id", combo.id);

    if (data) {
      setSelectedItems(data.map(item => item.menu_item_id));
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combo?")) return;

    const { error } = await supabase.from("combo_bundles").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting combo");
    } else {
      toast.success("Combo deleted successfully");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedItems.length === 0) {
        toast.error("Please select at least one item");
        return;
      }

      let imageUrl = editingCombo?.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("menu-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const comboData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        image_url: imageUrl
      };

      let comboId: string;

      if (editingCombo) {
        const { error } = await supabase
          .from("combo_bundles")
          .update(comboData)
          .eq("id", editingCombo.id);

        if (error) throw error;
        comboId = editingCombo.id;

        await supabase
          .from("combo_bundle_items")
          .delete()
          .eq("combo_bundle_id", comboId);
      } else {
        const { data: newCombo, error } = await supabase
          .from("combo_bundles")
          .insert(comboData)
          .select()
          .single();

        if (error) throw error;
        comboId = newCombo.id;
      }

      const items = selectedItems.map(itemId => ({
        combo_bundle_id: comboId,
        menu_item_id: itemId
      }));

      await supabase.from("combo_bundle_items").insert(items);

      toast.success(editingCombo ? "Combo updated" : "Combo created");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving combo");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: 0 });
    setSelectedItems([]);
    setEditingCombo(null);
    setImageFile(null);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Combo Bundles</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCombo ? "Edit" : "Add"} Combo Bundle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Combo Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Combo Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg">Select Items for Combo</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border rounded-md px-3"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
                  {filteredMenuItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`p-3 rounded border border-solid-2 cursor-pointer transition ${
                        selectedItems.includes(item.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-[faf8f5]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        <Badge variant="outline">
                          {categories.find(c => c.id === item.category_id)?.name || "No category"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Items ({selectedItems.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(itemId => {
                        const item = menuItems.find(i => i.id === itemId);
                        return (
                          <Badge key={itemId} variant="secondary" className="gap-1">
                            {item?.name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => toggleItemSelection(itemId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingCombo ? "Update Combo" : "Create Combo"}
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
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combos.map((combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-medium">{combo.name}</TableCell>
                  <TableCell>${combo.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(combo)} size="icon" variant="outline">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(combo.id)} size="icon" variant="destructive">
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

export default ComboManagement;
