import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

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

interface FormData {
  name: string;
  description: string;
  price: number;
  discounted_price: number;
  category_id: string;
  combo_offers: ComboOffer[];
}

const MenuItemManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      combo_offers: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "combo_offers"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, categoriesRes] = await Promise.all([
      supabase.from("menu_items").select("*").order("name"),
      supabase.from("categories").select("*").order("name")
    ]);

    if (itemsRes.data) setMenuItems(itemsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const handleEdit = async (item: MenuItem) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("price", item.price);
    setValue("discounted_price", item.discounted_price || 0);
    setValue("category_id", item.category_id || "");

    const { data: combos } = await supabase
      .from("combo_offers")
      .select("*")
      .eq("menu_item_id", item.id);

    if (combos) {
      setValue("combo_offers", combos.map(c => ({
        combo_name: c.combo_name,
        combo_price: c.combo_price
      })));
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting item");
    } else {
      toast.success("Item deleted successfully");
      fetchData();
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let imageUrl = editingItem?.image_url;

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

      const itemData = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        discounted_price: data.discounted_price ? Number(data.discounted_price) : null,
        category_id: data.category_id || null,
        image_url: imageUrl
      };

      let itemId: string;

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        itemId = editingItem.id;

        await supabase
          .from("combo_offers")
          .delete()
          .eq("menu_item_id", itemId);
      } else {
        const { data: newItem, error } = await supabase
          .from("menu_items")
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        itemId = newItem.id;
      }

      if (data.combo_offers && data.combo_offers.length > 0) {
        const combos = data.combo_offers.map(combo => ({
          menu_item_id: itemId,
          combo_name: combo.combo_name,
          combo_price: Number(combo.combo_price)
        }));

        await supabase.from("combo_offers").insert(combos);
      }

      toast.success(editingItem ? "Item updated" : "Item created");
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      setImageFile(null);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Menu Items</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setEditingItem(null); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...register("description")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" {...register("price", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Discounted Price</Label>
                  <Input type="number" step="0.01" {...register("discounted_price")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(value) => setValue("category_id", value)} defaultValue={editingItem?.category_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Combo Offers</Label>
                  <Button type="button" onClick={() => append({ combo_name: "", combo_price: 0 })} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Combo
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Combo Name</Label>
                      <Input {...register(`combo_offers.${index}.combo_name` as const)} placeholder="e.g., Mega Meal" />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Price</Label>
                      <Input type="number" step="0.01" {...register(`combo_offers.${index}.combo_price` as const)} />
                    </div>
                    <Button type="button" onClick={() => remove(index)} variant="destructive" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {categories.find(c => c.id === item.category_id)?.name || "-"}
                </TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(item)} size="icon" variant="outline">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(item.id)} size="icon" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MenuItemManagement;
