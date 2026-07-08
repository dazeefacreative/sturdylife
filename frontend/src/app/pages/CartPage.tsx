import { useNavigate } from "react-router";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import { getImageUrl } from "@/lib/media";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { MotionLink, MotionButton, ghostHoverVariants, arrowShiftVariants, tapScale, tapScaleSm } from "@/app/components/motion/primitives";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

export default function CartPage() {
  useDocumentTitle("Your Bag");
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const shippingFee = subtotal >= 250000 ? 0 : 2500;
  const total = subtotal + shippingFee;

  if (!items.length) {
    return (
      <>
        <SiteHeader />        
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
          style={{ fontFamily: "'Barlow', sans-serif" }}>
          <ShoppingBag size={48} strokeWidth={1} className="text-muted-foreground" />
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>Your bag is empty</h1>
          <p className="text-muted-foreground text-sm">Add something worth wearing.</p>
          <MotionLink to="/shop"
            initial="rest" whileHover="hover" whileTap={tapScale}
            variants={solidButtonVariants}
            className="flex items-center gap-3 text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase font-semibold">
            Shop Now <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
          </MotionLink>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
        <div className="border-b border-border px-6 md:px-12 py-6">
          <div className="max-w-[1440px] mx-auto">
            <h1 className="text-3xl font-black" style={{ fontFamily: "'Fraunces', serif" }}>
              Your <em className="font-light italic">Bag</em>
            </h1>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 grid md:grid-cols-[1fr_360px] gap-12">
          {/* Items */}
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 border-b border-border pb-6">
                <MotionLink to={`/product/${item.slug}`} whileTap={tapScaleSm} className="shrink-0">
                  <div className="w-24 h-32 bg-secondary overflow-hidden">
                    <img src={getImageUrl(item.image) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"}
                      alt={item.name} draggable={false} onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-cover protected-img" />
                  </div>
                </MotionLink>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                        {item.size && `Size ${item.size}`}
                      </p>
                      <MotionLink to={`/product/${item.slug}`} whileTap={tapScaleSm}>
                        <h3 className="text-sm font-medium">{item.name}</h3>
                      </MotionLink>
                    </div>
                    <MotionButton onClick={() => removeItem(item.id)}
                      initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                      className="shrink-0">
                      <X size={14} />
                    </MotionButton>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border">
                      <MotionButton onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                        className="w-8 h-8 flex items-center justify-center">
                        <Minus size={10} />
                      </MotionButton>
                      <span className="w-8 h-8 flex items-center justify-center text-xs">{item.quantity}</span>
                      <MotionButton onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        initial="rest" whileHover="hover" whileTap={tapScaleSm} variants={ghostHoverVariants}
                        className="w-8 h-8 flex items-center justify-center">
                        <Plus size={10} />
                      </MotionButton>
                    </div>
                    <p className="text-sm font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="h-fit bg-secondary p-6">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <span className="text-foreground">Free</span> : <>₦{shippingFee.toLocaleString()}</>}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Add ₦{(250000 - subtotal).toLocaleString()} more for free shipping
                </p>
              )}
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            <MotionButton
              onClick={() => navigate("/checkout")}
              initial="rest" whileHover="hover" whileTap={tapScale}
              variants={solidButtonVariants}
              className="w-full flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold">
              Proceed to Checkout
              <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
            </MotionButton>
            <MotionLink to="/shop" initial="rest" whileHover="hover" variants={ghostHoverVariants}
              className="block text-center text-[10px] tracking-widest uppercase mt-4">
              Continue Shopping
            </MotionLink>
          </aside>
        </div>
      </div>
    </>
  );
}
