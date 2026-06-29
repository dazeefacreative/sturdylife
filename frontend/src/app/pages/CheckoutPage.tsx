import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";
import { MotionButton, arrowShiftVariants, tapScale } from "@/app/components/motion/primitives";

const outlineButtonVariants = {
  rest: { backgroundColor: "rgba(0,0,0,0)", color: "var(--foreground)" },
  hover: { backgroundColor: "var(--action)", color: "var(--action-foreground)" },
};

const solidButtonVariants = {
  rest: { backgroundColor: "var(--foreground)" },
  hover: { backgroundColor: "rgba(var(--action-rgb), 0.8)" },
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingFee = subtotal >= 250 ? 0 : 15;
  const total = subtotal + shippingFee;

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
    email:      user?.email      || "",
    phone:      "",
    address_line1: "",
    address_line2: "",
    city:     "",
    state:    "",
    country:  "Nigeria",
    postal_code: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/payment/initialize", {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          size: i.size,
          quantity: i.quantity,
        })),
      });

      // Redirect to Paystack checkout
      window.location.href = data.payment_url;
    } catch (err: any) {
      setError(err.response?.data?.error || "Payment initialization failed. Please try again.");
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <ShoppingBag size={40} strokeWidth={1} className="text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Your bag is empty</p>
        <MotionButton
          onClick={() => navigate("/shop")}
          initial="rest" whileHover="hover" whileTap={tapScale}
          variants={outlineButtonVariants}
          className="text-xs tracking-widest uppercase border border-foreground px-8 py-3"
        >
          Continue Shopping
        </MotionButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border px-6 md:px-12 py-4">
        <a href="/" className="text-xs tracking-widest uppercase">← Sturdy Life</a>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-12 grid md:grid-cols-[1fr_380px] gap-16">
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h1 className="text-2xl font-black mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
            Checkout
          </h1>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-3">
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="First name" value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input required placeholder="Last name" value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input required type="email" placeholder="Email" value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="col-span-2 border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input placeholder="Phone number" value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="col-span-2 border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
            </div>
          </section>

          {/* Shipping */}
          <section className="mb-8">
            <h2 className="text-[10px] tracking-widest uppercase font-bold mb-4 border-b border-border pb-3">
              Shipping Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Address" value={form.address_line1}
                onChange={(e) => set("address_line1", e.target.value)}
                className="col-span-2 border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input placeholder="Apartment, suite, etc. (optional)" value={form.address_line2}
                onChange={(e) => set("address_line2", e.target.value)}
                className="col-span-2 border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input required placeholder="City" value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input required placeholder="State" value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input required placeholder="Country" value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
              <input placeholder="Postal code" value={form.postal_code}
                onChange={(e) => set("postal_code", e.target.value)}
                className="border border-border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-foreground transition-colors" />
            </div>
          </section>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <MotionButton
            type="submit"
            disabled={loading}
            initial="rest" whileHover={loading ? undefined : "hover"} whileTap={loading ? undefined : tapScale}
            variants={solidButtonVariants}
            className="w-full flex items-center justify-center gap-3 text-primary-foreground py-4 text-xs tracking-widest uppercase font-semibold disabled:opacity-50"
          >
            {loading ? "Redirecting to payment..." : (
              <>
                Pay ₦{total.toLocaleString()}
                <motion.span variants={arrowShiftVariants} className="flex"><ArrowRight size={14} /></motion.span>
              </>
            )}
          </MotionButton>
          <p className="text-center text-muted-foreground text-[10px] mt-3">
            Secured by Paystack • SSL encrypted
          </p>
        </form>

        {/* Order summary */}
        <aside className="bg-secondary p-6 h-fit">
          <h2 className="text-[10px] tracking-widest uppercase font-bold mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.size}`} className="flex gap-3">
                <div className="relative w-14 h-16 bg-muted shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-primary-foreground text-[9px] flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.size}</p>
                </div>
                <p className="text-xs font-semibold shrink-0">₦{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? "Free" : <>₦{shippingFee}</>}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
