import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;        // cart_item id
  product_id: number;
  name: string;
  slug: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: { id: number; name: string; slug: string; price: number; image?: string }, size: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);
const GUEST_CART_KEY = "sl_guest_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems]   = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const count    = items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);

  // Load cart on mount / user change. Guest cart persistence is handled
  // explicitly inside each mutation below (not via a reactive effect on
  // `items`) - an effect keyed on `items` would also fire on this initial
  // load with the stale pre-load value still in its closure, overwriting
  // the very data this effect is meant to read.
  useEffect(() => {
    if (user) {
      fetchServerCart();
    } else {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      setItems(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  const persistGuestCart = (nextItems: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextItems));
  };

  const fetchServerCart = async () => {
    try {
      const { data } = await api.get("/cart");
      setItems(data);
    } catch (_) { /* silently fail */ }
  };

  const addItem = useCallback(async (product: { id: number; name: string; slug: string; price: number; image?: string }, size: string, quantity = 1) => {
    setLoading(true);
    try {
      if (user) {
        await api.post("/cart", { product_id: product.id, size, quantity });
        await fetchServerCart();
      } else {
        setItems((prev) => {
          const existing = prev.find((i) => i.product_id === product.id && i.size === size);
          const next = existing
            ? prev.map((i) =>
                i.product_id === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            : [...prev, {
                id: Date.now(),
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                size,
                quantity,
                image: product.image || "",
              }];
          persistGuestCart(next);
          return next;
        });
      }
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (user) {
      await api.put(`/cart/${itemId}`, { quantity });
      await fetchServerCart();
    } else {
      setItems((prev) => {
        const next = quantity < 1
          ? prev.filter((i) => i.id !== itemId)
          : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        persistGuestCart(next);
        return next;
      });
    }
  }, [user]);

  const removeItem = useCallback(async (itemId: number) => {
    if (user) {
      await api.delete(`/cart/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        persistGuestCart(next);
        return next;
      });
    }
  }, [user]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (!user) localStorage.removeItem(GUEST_CART_KEY);
  }, [user]);

  return (
    <CartContext.Provider value={{
      items, count, subtotal, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, updateQuantity, removeItem, clearCart, loading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};
