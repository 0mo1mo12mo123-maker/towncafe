import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useFieldArray, useForm ,useWatch} from "react-hook-form";

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
  food_type?: string;
}

interface MenuItemImage {
  id: string;
  image_url: string;
  display_order: number;
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
  category_id: string | null;
  combo_offers: ComboOffer[];
  is_cafe_special: boolean;
  is_fast_selling: boolean;
  food_type: string;
}

const MenuItemManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<MenuItemImage[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      combo_offers: [],
      is_cafe_special: false,
      is_fast_selling: false,
      food_type: "veg",
      category_id: null,
      name: "",
      description: "",
      price: 0,
      discounted_price: 0
    }
  });

  const selectedCategory = useWatch({ control, name: "category_id" }) as string | null | undefined;


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

  const openAddDialogForCategory = (categoryId: string | null = null) => {
    reset({
      combo_offers: [],
      is_cafe_special: false,
      is_fast_selling: false,
      food_type: "veg",
      category_id: categoryId,
      name: "",
      description: "",
      price: 0,
      discounted_price: 0
    });
    setEditingItem(null);
    setImageFiles([]);
    setExistingImages([]);
    setIsDialogOpen(true);
  };

  const handleEdit = async (item: MenuItem) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("price", item.price);
    setValue("discounted_price", item.discounted_price || 0);
    setValue("category_id", item.category_id || null);
    setValue("is_cafe_special", (item as any).is_cafe_special || false);
    setValue("is_fast_selling", (item as any).is_fast_selling || false);
    setValue("food_type", item.food_type || "veg");

    const { data: combos } = await supabase
      .from("combo_offers")
      .select("*")
      .eq("menu_item_id", item.id);

    if (combos) {
      setValue(
        "combo_offers",
        combos.map((c: any) => ({
          combo_name: c.combo_name,
          combo_price: c.combo_price
        }))
      );
    } else {
      setValue("combo_offers", []);
    }

    // Fetch existing images
    const { data: images } = await supabase
      .from("menu_item_images")
      .select("*")
      .eq("menu_item_id", item.id)
      .order("display_order");

    if (images) {
      setExistingImages(images);
    } else {
      setExistingImages([]);
    }

    setImageFiles([]);
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

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    const { error } = await supabase.from("menu_item_images").delete().eq("id", imageId);

    if (error) {
      toast.error("Error deleting image");
    } else {
      setExistingImages(existingImages.filter(img => img.id !== imageId));
      toast.success("Image deleted");
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      let imageUrl = editingItem?.image_url;

      // Upload new images to menu_item_images table
      const uploadedImageUrls: string[] = [];

      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("menu-images").upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(fileName);

        uploadedImageUrls.push(urlData.publicUrl);
      }

      // Use first uploaded image as main image_url if no existing image
      if (uploadedImageUrls.length > 0 && !imageUrl) {
        imageUrl = uploadedImageUrls[0];
      }

      const itemData = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        discounted_price: data.discounted_price ? Number(data.discounted_price) : null,
        category_id: data.category_id || null,
        image_url: imageUrl,
        is_cafe_special: data.is_cafe_special,
        is_fast_selling: data.is_fast_selling,
        food_type: data.food_type
      };

      let itemId: string;

      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(itemData).eq("id", editingItem.id);

        if (error) throw error;
        itemId = editingItem.id;

        await supabase.from("combo_offers").delete().eq("menu_item_id", itemId);
      } else {
        const { data: newItem, error } = await supabase.from("menu_items").insert(itemData).select().single();

        if (error) throw error;
        itemId = (newItem as any).id;
      }

      // Insert uploaded images into menu_item_images
      if (uploadedImageUrls.length > 0) {
        const imagesToInsert = uploadedImageUrls.map((url, index) => ({
          menu_item_id: itemId,
          image_url: url,
          display_order: existingImages.length + index
        }));

        await supabase.from("menu_item_images").insert(imagesToInsert);
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
      setImageFiles([]);
      setExistingImages([]);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving item");
    } finally {
      setLoading(false);
    }
  };

  // group items by category id (null for uncategorized)
  const itemsByCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category_id || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Menu Items</CardTitle>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => openAddDialogForCategory(null)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {categories.map((cat) => {
            const items = itemsByCategory[cat.id] || [];
            return (
              <details key={cat.id} className="border rounded-md" >
                <summary className="cursor-pointer flex items-center justify-between px-4 py-2 bg-muted/60">
                  <div className="font-medium">{cat.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); openAddDialogForCategory(cat.id); }} variant="outline">
                      <Plus className="h-3 w-3 mr-2" /> Add
                    </Button>
                  </div>
                </summary>

                <div className="p-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No items in this category.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Price</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="hidden md:table-cell">${item.price.toFixed(2)}</TableCell>
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
                    </div>
                  )}
                </div>
              </details>
            );
          })}

          {/* Uncategorized */}
          { (itemsByCategory["uncategorized"] || []).length > 0 && (
            <details className="border rounded-md">
              <summary className="cursor-pointer flex items-center justify-between px-4 py-2 bg-muted/60">
                <div className="font-medium">Uncategorized</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">{(itemsByCategory["uncategorized"] || []).length} item{(itemsByCategory["uncategorized"] || []).length !== 1 ? "s" : ""}</div>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); openAddDialogForCategory(null); }} variant="outline">
                    <Plus className="h-3 w-3 mr-2" /> Add
                  </Button>
                </div>
              </summary>
              <div className="p-3">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(itemsByCategory["uncategorized"] || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden md:table-cell">${item.price.toFixed(2)}</TableCell>
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
                </div>
              </div>
            </details>
          )}
        </div>
      </CardContent>

      {/* Dialog (create / edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-2">
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
  <Select
    // Handle null mapping for "None" option
    onValueChange={(value) =>
      setValue("category_id", value === "__none" ? null : value)
    }
    // If selectedCategory is null or undefined, show "__none"
    value={selectedCategory ?? "__none"}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      {/* Radix Select.Item requires a non-empty string value */}
      <SelectItem value="__none">None</SelectItem>
      {categories.map((cat) => (
        <SelectItem key={cat.id} value={String(cat.id)}>
          {cat.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


            <div className="space-y-2">
              <Label>Food Type</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="veg" value="veg" {...register("food_type")} className="h-4 w-4" />
                  <Label htmlFor="veg" className="cursor-pointer">🌱 Veg</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="non_veg" value="non_veg" {...register("food_type")} className="h-4 w-4" />
                  <Label htmlFor="non_veg" className="cursor-pointer">🍖 Non-Veg</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Images (Upload multiple)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImageFiles(prev => [...prev, ...files]);
                }}
              />

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm">Existing Images</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.image_url} alt="Menu item" className="w-full h-20 object-cover rounded" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images to upload */}
              {imageFiles.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm">New Images to Upload</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-20 object-cover rounded" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="is_cafe_special" {...register("is_cafe_special")} className="h-4 w-4" />
                <Label htmlFor="is_cafe_special" className="cursor-pointer">Cafe Special</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="is_fast_selling" {...register("is_fast_selling")} className="h-4 w-4" />
                <Label htmlFor="is_fast_selling" className="cursor-pointer">Fast Selling</Label>
              </div>
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
    </Card>
  );
};

export default MenuItemManagement;
