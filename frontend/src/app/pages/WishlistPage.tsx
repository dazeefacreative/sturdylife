import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Plus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useCart } from "@/app/context/CartContext";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { MotionLink, MotionButton, ghostHoverVariants, arrowShiftVariants, tapScale, tapScaleSm } from "@/app/components/motion/primitives";

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "#0a0a0a", color: "#ffffff" },
};

export default function WishlistPage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/wishlist")
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    await api.delete(`/wishlist/${productId}`);
  };

  const handleAdd = async (productId: number) => {
    await addItem(productId, "M", 1);
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      <SiteHeader />

      <div className="border-b border-border px-6 md:px-12 py-8">
        <div className="max-w-[1440px] mx-auto">
          <MotionLink to="/account" initial="rest" whileHover="hover" variants={ghostHoverVariants}
            className="text-[10px] tracking-widest uppercase mb-4 block">← Account</MotionLink>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
            My <em className="font-light italic">Wishlist</em>
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-secondary mb-4" />
                <div className="h-3 bg-secondary w-1/3 mb-2" />
                <div className="h-4 bg-secondary w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} strokeWidth={1} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm mb-6">Nothing saved yet.</p>
            <MotionLink to="/shop" initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
              className="text-xs tracking-widest uppercase border border-foreground px-8 py-3 inline-block">
              Browse Products
            </MotionLink>
          </div>
        ) : (
          <Reveal y={32}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {items.map((item) => (
                <motion.div key={item.product_id} initial="rest" whileHover="hover" className="cursor-pointer"
                  onClick={() => navigate(`/product/${item.slug}`)}>
                  <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4">
                    <img src={item.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop"}
                      alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    {item.tag && (
                      <span className="absolute top-3 left-3 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1">
                        {item.tag}
                      </span>
                    )}
                    <MotionButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(item.product_id); }}
                      whileTap={tapScaleSm}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center">
                      <Heart size={16} strokeWidth={1.5} className="fill-white stroke-white" />
                    </MotionButton>
                    <MotionButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(item.product_id); }}
                      whileTap={tapScaleSm}
                      className="absolute bottom-0 left-0 right-0 bg-foreground text-primary-foreground flex items-center justify-center gap-2 py-3 text-[11px] tracking-widest uppercase font-semibold">
                      <Plus size={12} strokeWidth={2} /> Add to bag
                    </MotionButton>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug">{item.name}</h3>
                    <p className="text-sm font-semibold shrink-0">₦{Number(item.price).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        )}

        {items.length > 0 && (
          <div className="mt-14 text-center">
            <MotionLink to="/shop"
              initial="rest" whileHover="hover" whileTap={tapScale} variants={outlineButtonVariants}
              className="inline-flex items-center gap-3 border border-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold">
              Continue Shopping <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
            </MotionLink>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
