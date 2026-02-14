import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product, ProductVariation } from "@shared/contracts";
import { useToast } from "@/shared/hooks/use-toast";

interface CartItem extends Product {
  quantity: number;
  variationId?: number;
  variationLabel?: string;
  variationPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variation?: ProductVariation) => void;
  removeFromCart: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, variation?: ProductVariation) => {
    const isOutOfStock = variation ? !variation.inStock : !product.inStock;
    if (isOutOfStock) {
      toast({
        title: "Produto sem estoque",
        description: "Este item não está disponível no momento.",
        variant: "destructive",
      });
      return;
    }
    
    setItems((prev) => {
      const existing = prev.find((item) => 
        item.id === product.id && item.variationId === variation?.id
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.variationId === variation?.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: 1,
        variationId: variation?.id,
        variationLabel: variation?.label,
        variationPrice: variation?.price,
        price: variation?.price ?? product.price
      }];
    });
    const itemName = variation 
      ? `${product.name} (${variation.label})` 
      : product.name;
    toast({
      title: "Adicionado ao carrinho",
      description: `${itemName} foi adicionado.`,
    });
  };

  const removeFromCart = (productId: number, variationId?: number) => {
    setItems((prev) => prev.filter((item) => 
      !(item.id === productId && item.variationId === variationId)
    ));
  };

  const updateQuantity = (productId: number, quantity: number, variationId?: number) => {
    if (quantity < 1) {
      removeFromCart(productId, variationId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId && item.variationId === variationId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
