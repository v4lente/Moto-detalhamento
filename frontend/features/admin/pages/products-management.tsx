import React, { useState, useEffect, useMemo } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Checkbox } from "@/shared/ui/checkbox";
import { CreatableSelect } from "@/shared/ui/creatable-select";
import { ImageUpload } from "@/shared/components/ImageUpload";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  useProducts, 
  useProductMutations, 
  useVariationMutations,
  fetchProductVariations 
} from "../hooks/use-admin";
import type { ProductWithImages, ProductVariation } from "@shared/contracts";
import { 
  Plus, Pencil, Trash2, Package, Loader2, X, ToggleLeft, ToggleRight 
} from "lucide-react";

export function ProductsManagementPage() {
  const { toast } = useToast();
  
  // Product state
  const [editingProduct, setEditingProduct] = useState<ProductWithImages | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productCategory, setProductCategory] = useState("");
  const [productInStock, setProductInStock] = useState(true);
  
  // Variations state
  const [isVariationsDialogOpen, setIsVariationsDialogOpen] = useState(false);
  const [variationsProductId, setVariationsProductId] = useState<number | null>(null);
  const [variationsProductName, setVariationsProductName] = useState<string>("");
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [variationLabel, setVariationLabel] = useState("");
  const [variationPrice, setVariationPrice] = useState("");
  const [variationInStock, setVariationInStock] = useState(true);
  const [productVariationCounts, setProductVariationCounts] = useState<Record<number, number>>({});

  // Queries
  const { data: products, isLoading: productsLoading } = useProducts();
  
  // Mutations
  const { createProductMutation, updateProductMutation, deleteProductMutation } = useProductMutations();
  const { createVariationMutation, updateVariationMutation, deleteVariationMutation } = useVariationMutations(
    variations,
    setVariations,
    variationsProductId,
    setProductVariationCounts
  );

  // Load variation counts for products
  useEffect(() => {
    const loadVariationCounts = async () => {
      if (!products) return;
      const counts: Record<number, number> = {};
      await Promise.all(
        products.map(async (product) => {
          try {
            const productVariations = await fetchProductVariations(product.id);
            counts[product.id] = productVariations.length;
          } catch {
            counts[product.id] = 0;
          }
        })
      );
      setProductVariationCounts(counts);
    };
    loadVariationCounts();
  }, [products]);

  const existingCategories = useMemo(() => {
    if (!products) return [];
    const categories = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [products]);

  const handleOpenVariationsDialog = async (product: ProductWithImages) => {
    setVariationsProductId(product.id);
    setVariationsProductName(product.name);
    setVariationsLoading(true);
    setIsVariationsDialogOpen(true);
    setEditingVariation(null);
    setVariationLabel("");
    setVariationPrice("");
    
    try {
      const productVariations = await fetchProductVariations(product.id);
      setVariations(productVariations);
    } catch {
      toast({ title: "Erro ao carregar variações", variant: "destructive" });
      setVariations([]);
    } finally {
      setVariationsLoading(false);
    }
  };

  const handleVariationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variationsProductId) return;
    
    const price = parseFloat(variationPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Preço inválido", variant: "destructive" });
      return;
    }

    if (editingVariation) {
      updateVariationMutation.mutate({
        id: editingVariation.id,
        data: { label: variationLabel, price, inStock: variationInStock }
      }, {
        onSuccess: () => {
          setEditingVariation(null);
          setVariationLabel("");
          setVariationPrice("");
          setVariationInStock(true);
        }
      });
    } else {
      createVariationMutation.mutate({
        productId: variationsProductId,
        data: { label: variationLabel, price, inStock: variationInStock }
      }, {
        onSuccess: () => {
          setVariationLabel("");
          setVariationPrice("");
          setVariationInStock(true);
        }
      });
    }
  };

  const handleEditVariation = (variation: ProductVariation) => {
    setEditingVariation(variation);
    setVariationLabel(variation.label);
    setVariationPrice(variation.price.toString());
    setVariationInStock(variation.inStock);
  };

  const handleCancelEditVariation = () => {
    setEditingVariation(null);
    setVariationLabel("");
    setVariationPrice("");
    setVariationInStock(true);
  };

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!productCategory.trim()) {
      toast({
        title: "Categoria obrigatória",
        description: "Por favor, selecione ou crie uma categoria.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      image: productImage,
      images: productImages,
      category: productCategory.trim(),
      inStock: productInStock,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData }, {
        onSuccess: () => {
          setEditingProduct(null);
          setIsProductDialogOpen(false);
        }
      });
    } else {
      createProductMutation.mutate(productData, {
        onSuccess: () => {
          setIsProductDialogOpen(false);
        }
      });
    }
  };

  return (
    <TabsContent value="products" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Gerenciar Produtos</h2>
        <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
          setIsProductDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setProductImage("");
            setProductImages([]);
            setProductCategory("");
            setProductInStock(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-black hover:bg-primary/90" 
              data-testid="button-add-product"
              onClick={() => {
                setEditingProduct(null);
                setProductImage("");
                setProductImages([]);
                setProductCategory("");
                setProductInStock(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name} required data-testid="input-product-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" defaultValue={editingProduct?.description} required data-testid="input-product-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required data-testid="input-product-price" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <CreatableSelect
                    value={productCategory}
                    onChange={setProductCategory}
                    options={existingCategories}
                    placeholder="Selecione ou crie"
                    createLabel="Criar categoria"
                    data-testid="input-product-category"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagem Principal</Label>
                <ImageUpload value={productImage} onChange={setProductImage} />
              </div>
              <div className="space-y-2">
                <Label>Fotos Adicionais ({productImages.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {productImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Foto ${index + 1}`} className="w-full h-20 object-contain rounded border border-border bg-black/20" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setProductImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <ImageUpload 
                  value="" 
                  onChange={(url) => {
                    if (url) setProductImages(prev => [...prev, url]);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="productInStock"
                  checked={productInStock}
                  onCheckedChange={(checked) => setProductInStock(checked === true)}
                  data-testid="checkbox-product-in-stock"
                />
                <Label htmlFor="productInStock" className="cursor-pointer">
                  Produto em estoque
                </Label>
              </div>
              <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-product">
                {editingProduct ? "Atualizar" : "Criar"} Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {products?.map((product) => (
            <Card key={product.id} className="bg-card border-border" data-testid={`admin-product-${product.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 bg-black/20 rounded overflow-hidden border border-border relative flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                  {product.images && product.images.length > 0 && (
                    <span className="absolute bottom-0 right-0 bg-primary text-black text-[10px] font-bold px-1 rounded-tl">
                      +{product.images.length}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category} • R$ {product.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenVariationsDialog(product)}
                    data-testid={`button-variations-${product.id}`}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Variações{productVariationCounts[product.id] ? ` (${productVariationCounts[product.id]})` : ""}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingProduct(product);
                      setProductImage(product.image);
                      setProductImages(product.images || []);
                      setProductCategory(product.category);
                      setProductInStock(product.inStock);
                      setIsProductDialogOpen(true);
                    }}
                    data-testid={`button-edit-${product.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Variations Dialog */}
      <Dialog open={isVariationsDialogOpen} onOpenChange={(open) => {
        setIsVariationsDialogOpen(open);
        if (!open) {
          setVariationsProductId(null);
          setVariationsProductName("");
          setVariations([]);
          setEditingVariation(null);
          setVariationLabel("");
          setVariationPrice("");
        }
      }}>
        <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">
              Variações: {variationsProductName}
            </DialogTitle>
          </DialogHeader>
          
          {variationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add/Edit Variation Form */}
              <form onSubmit={handleVariationSubmit} className="space-y-3 p-4 bg-background rounded-lg border border-border">
                <h4 className="font-medium text-sm">
                  {editingVariation ? "Editar Variação" : "Nova Variação"}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="variationLabel" className="text-xs">Rótulo (ex: 100ml, 500ml)</Label>
                    <Input
                      id="variationLabel"
                      value={variationLabel}
                      onChange={(e) => setVariationLabel(e.target.value)}
                      placeholder="100ml"
                      required
                      data-testid="input-variation-label"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="variationPrice" className="text-xs">Preço (R$)</Label>
                    <Input
                      id="variationPrice"
                      type="number"
                      step="0.01"
                      value={variationPrice}
                      onChange={(e) => setVariationPrice(e.target.value)}
                      placeholder="29.90"
                      required
                      data-testid="input-variation-price"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="variationInStock"
                    checked={variationInStock}
                    onCheckedChange={(checked) => setVariationInStock(checked === true)}
                    data-testid="checkbox-variation-in-stock"
                  />
                  <Label htmlFor="variationInStock" className="text-xs cursor-pointer">
                    Em estoque
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary text-black hover:bg-primary/90"
                    disabled={createVariationMutation.isPending || updateVariationMutation.isPending}
                    data-testid="button-save-variation"
                  >
                    {(createVariationMutation.isPending || updateVariationMutation.isPending) && (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    )}
                    {editingVariation ? "Atualizar" : "Adicionar"}
                  </Button>
                  {editingVariation && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditVariation}
                      data-testid="button-cancel-edit-variation"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>

              {/* Existing Variations List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Variações existentes ({variations.length})
                </h4>
                {variations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma variação cadastrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                        data-testid={`variation-item-${variation.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{variation.label}</p>
                            {!variation.inStock && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                Sem estoque
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-primary">R$ {variation.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={variation.inStock ? "outline" : "secondary"}
                            size="sm"
                            className={`text-xs ${variation.inStock ? "text-green-500 border-green-500" : "text-red-400"}`}
                            onClick={() => {
                              updateVariationMutation.mutate({
                                id: variation.id,
                                data: { label: variation.label, price: variation.price, inStock: !variation.inStock }
                              });
                            }}
                            disabled={updateVariationMutation.isPending}
                            data-testid={`button-toggle-stock-${variation.id}`}
                          >
                            {variation.inStock ? (
                              <><ToggleRight className="h-3 w-3 mr-1" /> Em estoque</>
                            ) : (
                              <><ToggleLeft className="h-3 w-3 mr-1" /> Sem estoque</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditVariation(variation)}
                            data-testid={`button-edit-variation-${variation.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteVariationMutation.mutate(variation.id)}
                            disabled={deleteVariationMutation.isPending}
                            data-testid={`button-delete-variation-${variation.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}

export default ProductsManagementPage;
